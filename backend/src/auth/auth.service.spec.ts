import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { AuthService } from './auth.service';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';
import { Perfil, Usuario, UsuarioPerfil } from '../database/entities';
import { compare, hash } from 'bcrypt';

describe('Serviço de autenticação', () => {
  const usuarioId = '01a12345-6789-4abc-8def-0123456789ab';
  const perfilId = '02b12345-6789-4abc-8def-0123456789ab';
  const criadoEm = new Date('2026-10-13T12:00:00.000Z');

  let service: AuthService;
  let findUsuario: jest.Mock;
  let findPerfil: jest.Mock;
  let save: jest.Mock;
  let transaction: jest.Mock;
  let jwtService: JwtService;

  const dadosCadastro = (): CadastroDto => ({
    nome: 'Maria Silva',
    email: ' Maria@Exemplo.Test ',
    senha: 'senha-segura-123',
  });

  beforeEach(async () => {
    findUsuario = jest.fn().mockResolvedValue(null);
    findPerfil = jest.fn().mockResolvedValue({
      id: perfilId,
      codigo: 'LEITOR',
      descricao: 'Perfil leitor',
    });
    save = jest.fn().mockImplementation(async (entidade, dados) => {
      if (entidade === Usuario) {
        return {
          ...dados,
          id: usuarioId,
          criadoEm,
          atualizadoEm: criadoEm,
        };
      }

      return dados;
    });

    const manager = {
      findOneBy: findPerfil,
      save,
    };

    transaction = jest.fn(
      async (operacao: (manager: EntityManager) => Promise<unknown>) =>
        operacao(manager as unknown as EntityManager),
    );

    const dataSource = {
      getRepository: jest.fn().mockReturnValue({ findOneBy: findUsuario }),
      transaction,
    };

    jwtService = new JwtService({
      secret: 'segredo-jwt-de-teste-com-mais-de-trinta-e-dois-bytes',
      signOptions: { algorithm: 'HS256', expiresIn: 3600 },
    });
    service = new AuthService(
      dataSource as unknown as DataSource,
      jwtService,
    );
  });

  it('cria uma conta local normalizada, com senha protegida e perfil LEITOR', async () => {
    const result = await service.cadastrar(dadosCadastro());

    expect(findUsuario).toHaveBeenCalledWith({ email: 'maria@exemplo.test' });
    expect(findPerfil).toHaveBeenCalledWith(Perfil, { codigo: 'LEITOR' });
    expect(save).toHaveBeenNthCalledWith(
      1,
      Usuario,
      expect.objectContaining({
        nome: 'Maria Silva',
        email: 'maria@exemplo.test',
        ativo: true,
      }),
    );
    expect(save).toHaveBeenNthCalledWith(2, UsuarioPerfil, {
      usuarioId,
      perfilId,
    });

    const usuarioCriado = save.mock.calls[0][1] as { senhaHash: string };
    expect(await compare('senha-segura-123', usuarioCriado.senhaHash)).toBe(
      true,
    );
    expect(result).toEqual({
      id: usuarioId,
      nome: 'Maria Silva',
      email: 'maria@exemplo.test',
      ativo: true,
      criadoEm: criadoEm.toISOString(),
    });
    expect(result).not.toHaveProperty('senhaHash');
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('rejeita e-mail já cadastrado antes de gerar o hash da senha', async () => {
    findUsuario.mockResolvedValue({ id: usuarioId });

    await expect(service.cadastrar(dadosCadastro())).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejeita senhas com mais de 72 bytes em UTF-8', async () => {
    const dados = dadosCadastro();
    dados.senha = 'ç'.repeat(37);

    await expect(service.cadastrar(dados)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    expect(findUsuario).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('converte conflito concorrente de e-mail único em HTTP 409', async () => {
    const erroPostgres = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: 'uq_usuarios_email_ci',
    });
    transaction.mockRejectedValue(
      new QueryFailedError('INSERT INTO usuarios', [], erroPostgres),
    );

    await expect(service.cadastrar(dadosCadastro())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('falha explicitamente quando o perfil LEITOR não está cadastrado', async () => {
    findPerfil.mockResolvedValue(null);

    await expect(service.cadastrar(dadosCadastro())).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(save).not.toHaveBeenCalled();
  });

  it('autentica conta ativa e retorna JWT assinado com o UUID no sub', async () => {
    const senhaHash = await hash('senha-segura-123', 4);
    findUsuario.mockResolvedValue({
      id: usuarioId,
      email: 'maria@exemplo.test',
      ativo: true,
      senhaHash,
    });
    const dados: LoginDto = {
      email: ' Maria@Exemplo.Test ',
      senha: 'senha-segura-123',
    };

    const result = await service.login(dados);
    const payload = await jwtService.verifyAsync(result.accessToken, {
      algorithms: ['HS256'],
    });

    expect(findUsuario).toHaveBeenCalledWith({ email: 'maria@exemplo.test' });
    expect(result).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    expect(payload).toEqual(
      expect.objectContaining({
        sub: usuarioId,
        exp: expect.any(Number),
        iat: expect.any(Number),
      }),
    );
    expect(payload).not.toHaveProperty('email');
  });

  it('rejeita credenciais inválidas com a mesma resposta de autenticação', async () => {
    findUsuario.mockResolvedValue(null);

    await expect(
      service.login({ email: 'ausente@exemplo.test', senha: 'senha-invalida' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    findUsuario.mockResolvedValue({
      id: usuarioId,
      ativo: true,
      senhaHash: await hash('senha-correta', 4),
    });

    await expect(
      service.login({ email: 'maria@exemplo.test', senha: 'senha-errada' }),
    ).rejects.toThrow('E-mail ou senha inválidos.');
  });

  it('rejeita conta inativa após verificar a senha', async () => {
    findUsuario.mockResolvedValue({
      id: usuarioId,
      ativo: false,
      senhaHash: await hash('senha-segura-123', 4),
    });

    await expect(
      service.login({ email: 'maria@exemplo.test', senha: 'senha-segura-123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita conta sem credencial local', async () => {
    findUsuario.mockResolvedValue({
      id: usuarioId,
      ativo: true,
      senhaHash: null,
    });

    await expect(
      service.login({ email: 'maria@exemplo.test', senha: 'senha-segura-123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita senha de login acima de 72 bytes sem consultar o usuário', async () => {
    await expect(
      service.login({
        email: 'maria@exemplo.test',
        senha: 'ç'.repeat(37),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(findUsuario).not.toHaveBeenCalled();
  });
});

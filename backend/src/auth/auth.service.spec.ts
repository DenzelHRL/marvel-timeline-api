import {
  ConflictException,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { AuthService } from './auth.service';
import { CadastroDto } from './dto/cadastro.dto';
import { Perfil, Usuario, UsuarioPerfil } from '../database/entities';
import { compare } from 'bcrypt';

describe('Serviço de autenticação', () => {
  const usuarioId = '01a12345-6789-4abc-8def-0123456789ab';
  const perfilId = '02b12345-6789-4abc-8def-0123456789ab';
  const criadoEm = new Date('2026-10-13T12:00:00.000Z');

  let service: AuthService;
  let findUsuario: jest.Mock;
  let findPerfil: jest.Mock;
  let save: jest.Mock;
  let transaction: jest.Mock;

  const dadosCadastro = (): CadastroDto => ({
    nome: 'Maria Silva',
    email: ' Maria@Exemplo.Test ',
    senha: 'senha-segura-123',
  });

  beforeEach(() => {
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

    service = new AuthService(dataSource as unknown as DataSource);
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
});

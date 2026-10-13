import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager } from 'typeorm';
import {
  IdentidadeExterna,
  Perfil,
  Usuario,
  UsuarioPerfil,
} from '../database/entities';
import { AuthService } from './auth.service';
import { GoogleAuthProfile } from './google.strategy';

describe('Autenticação com Google', () => {
  const usuarioId = '01a12345-6789-4abc-8def-0123456789ab';
  const perfilId = '02b12345-6789-4abc-8def-0123456789ab';
  const googleProfile: GoogleAuthProfile = {
    id: 'google-user-123',
    nome: 'Maria Silva',
    email: ' Maria@Exemplo.Test ',
  };

  let service: AuthService;
  let jwtService: JwtService;
  let findIdentity: jest.Mock;
  let findUser: jest.Mock;
  let findProfile: jest.Mock;
  let save: jest.Mock;
  let transaction: jest.Mock;
  let repositoryIdentity: jest.Mock;
  let repositoryUser: jest.Mock;

  beforeEach(() => {
    findIdentity = jest.fn().mockResolvedValue(null);
    findUser = jest.fn().mockResolvedValue(null);
    findProfile = jest.fn().mockResolvedValue({
      id: perfilId,
      codigo: 'LEITOR',
      descricao: 'Perfil leitor',
    });
    save = jest.fn().mockImplementation(async (entity, data) => {
      if (entity === Usuario) {
        return { ...data, id: usuarioId };
      }
      return data;
    });

    const manager = {
      findOneBy: jest.fn((entity, criteria) => {
        if (entity === IdentidadeExterna) return findIdentity(criteria);
        if (entity === Usuario) return findUser(criteria);
        if (entity === Perfil) return findProfile(criteria);
        throw new Error(`Entidade não prevista no teste: ${entity.name}`);
      }),
      save,
    };

    transaction = jest.fn(
      async (operation: (manager: EntityManager) => Promise<unknown>) =>
        operation(manager as unknown as EntityManager),
    );

    repositoryIdentity = jest.fn().mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue(null),
    });
    repositoryUser = jest.fn().mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue(null),
    });
    const dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === IdentidadeExterna) return repositoryIdentity();
        if (entity === Usuario) return repositoryUser();
        throw new Error(`Repositório não previsto no teste: ${entity.name}`);
      }),
      transaction,
    };

    jwtService = new JwtService({
      secret: 'segredo-jwt-de-teste-com-mais-de-trinta-e-dois-bytes',
      signOptions: { algorithm: 'HS256', expiresIn: 3600 },
    });
    service = new AuthService(dataSource as unknown as DataSource, jwtService);
  });

  it('cria conta LEITOR e vincula a identidade Google em uma transação', async () => {
    const result = await service.loginGoogle(googleProfile);
    const payload = await jwtService.verifyAsync(result.accessToken, {
      algorithms: ['HS256'],
    });

    expect(findIdentity).toHaveBeenCalledWith({
      provedor: 'google',
      idNoProvedor: googleProfile.id,
    });
    expect(findUser).toHaveBeenCalledWith({ email: 'maria@exemplo.test' });
    expect(findProfile).toHaveBeenCalledWith({ codigo: 'LEITOR' });
    expect(save).toHaveBeenNthCalledWith(
      1,
      Usuario,
      expect.objectContaining({
        nome: 'Maria Silva',
        email: 'maria@exemplo.test',
        senhaHash: null,
        ativo: true,
      }),
    );
    expect(save).toHaveBeenNthCalledWith(
      2,
      IdentidadeExterna,
      expect.objectContaining({
        usuarioId,
        provedor: 'google',
        idNoProvedor: googleProfile.id,
      }),
    );
    expect(save).toHaveBeenNthCalledWith(3, UsuarioPerfil, {
      usuarioId,
      perfilId,
    });
    expect(result).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    expect(payload.sub).toBe(usuarioId);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('reutiliza a identidade Google existente sem criar outra conta', async () => {
    findIdentity.mockResolvedValue({
      usuarioId,
      provedor: 'google',
      idNoProvedor: googleProfile.id,
    });
    findUser.mockResolvedValue({
      id: usuarioId,
      ativo: true,
    });

    const result = await service.loginGoogle(googleProfile);
    const payload = await jwtService.verifyAsync(result.accessToken);

    expect(payload.sub).toBe(usuarioId);
    expect(save).not.toHaveBeenCalled();
  });

  it('não vincula automaticamente uma identidade Google por e-mail coincidente', async () => {
    findUser.mockResolvedValue({
      id: usuarioId,
      email: 'maria@exemplo.test',
    });

    await expect(service.loginGoogle(googleProfile)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(save).not.toHaveBeenCalled();
  });

  it('rejeita uma conta local inativa vinculada à identidade Google', async () => {
    findIdentity.mockResolvedValue({
      usuarioId,
      provedor: 'google',
      idNoProvedor: googleProfile.id,
    });
    findUser.mockResolvedValue({
      id: usuarioId,
      ativo: false,
    });

    await expect(service.loginGoogle(googleProfile)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('falha explicitamente se o perfil LEITOR não estiver cadastrado', async () => {
    findProfile.mockResolvedValue(null);

    await expect(service.loginGoogle(googleProfile)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(save).not.toHaveBeenCalled();
  });
});

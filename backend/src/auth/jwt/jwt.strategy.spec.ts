import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';

describe('Estratégia JWT', () => {
  const usuarioId = '01a12345-6789-4abc-8def-0123456789ab';
  const originalSecret = process.env.JWT_SECRET;
  let query: jest.Mock;
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET =
      'segredo-jwt-de-teste-com-mais-de-trinta-e-dois-bytes';
    query = jest.fn();
    strategy = new JwtStrategy({ query } as unknown as DataSource);
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('carrega o usuário ativo, seus perfis e permissões efetivas', async () => {
    query.mockResolvedValue([
      {
        id: usuarioId,
        roles: ['ADMIN'],
        permissions: ['usuarios:consultar_todos'],
      },
    ]);

    await expect(strategy.validate({ sub: usuarioId })).resolves.toEqual({
      id: usuarioId,
      roles: ['ADMIN'],
      permissions: ['usuarios:consultar_todos'],
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('u.ativo = TRUE'),
      [usuarioId],
    );
  });

  it('rejeita tokens sem um UUID no subject', async () => {
    await expect(
      strategy.validate({ sub: 'not-a-uuid' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(query).not.toHaveBeenCalled();
  });

  it('rejeita contas inexistentes ou inativas', async () => {
    query.mockResolvedValue([]);

    await expect(strategy.validate({ sub: usuarioId })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  PERMISSOES_REQUERIDAS_METADATA,
  PERFIS_REQUERIDOS_METADATA,
} from './autorizacao.metadata';
import { ControleAcessoGuard } from './controle-acesso.guard';

describe('Guard de autorização', () => {
  const user: AuthenticatedUser = {
    id: '01a12345-6789-4abc-8def-0123456789ab',
    roles: ['ADMIN'],
    permissions: ['usuarios:consultar_todos', 'acessos:alterar_permissoes'],
  };

  let requirements: Map<string, string[] | undefined>;
  let guard: ControleAcessoGuard;
  let request: { user?: AuthenticatedUser };

  const context = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    requirements = new Map();
    request = { user };
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => requirements.get(key)),
    } as unknown as Reflector;
    guard = new ControleAcessoGuard(reflector);
  });

  it('permite quando a rota não declara requisitos adicionais', () => {
    expect(guard.canActivate(context())).toBe(true);
  });

  it('exige usuário autenticado quando a rota declara perfil ou permissão', () => {
    request.user = undefined;
    requirements.set(PERMISSOES_REQUERIDAS_METADATA, [
      'usuarios:consultar_todos',
    ]);

    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
  });

  it('aceita qualquer um dos perfis declarados', () => {
    requirements.set(PERFIS_REQUERIDOS_METADATA, ['LEITOR', 'ADMIN']);

    expect(guard.canActivate(context())).toBe(true);
  });

  it('nega perfil não autorizado', () => {
    requirements.set(PERFIS_REQUERIDOS_METADATA, ['LEITOR']);

    expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
  });

  it('exige todas as permissões declaradas', () => {
    requirements.set(PERMISSOES_REQUERIDAS_METADATA, [
      'usuarios:consultar_todos',
      'usuarios:alterar_status',
    ]);

    expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
  });

  it('permite quando o usuário possui todas as permissões declaradas', () => {
    requirements.set(PERMISSOES_REQUERIDAS_METADATA, [
      'usuarios:consultar_todos',
      'acessos:alterar_permissoes',
    ]);

    expect(guard.canActivate(context())).toBe(true);
  });
});

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  PERMISSOES_REQUERIDAS_METADATA,
  PERFIS_REQUERIDOS_METADATA,
} from './autorizacao.metadata';

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Injectable()
export class ControleAcessoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      PERFIS_REQUERIDOS_METADATA,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSOES_REQUERIDAS_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Autenticação JWT obrigatória.');
    }

    if (
      requiredRoles?.length &&
      !requiredRoles.some((role) => user.roles.includes(role))
    ) {
      throw new ForbiddenException('O perfil não permite esta operação.');
    }

    if (
      requiredPermissions?.length &&
      !requiredPermissions.every((permission) =>
        user.permissions.includes(permission),
      )
    ) {
      throw new ForbiddenException('Permissão insuficiente.');
    }

    return true;
  }
}

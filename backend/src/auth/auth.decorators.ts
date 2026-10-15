import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from './auth.types';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

export function Authenticated(): MethodDecorator & ClassDecorator {
  return UseGuards(JwtAuthGuard);
}

export const CurrentUser = createParamDecorator(
  (
    property: keyof AuthenticatedUser | undefined,
    context: ExecutionContext,
  ): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário autenticado não encontrado.');
    }

    return property ? user[property] : user;
  },
);

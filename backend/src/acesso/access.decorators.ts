import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { AccessControlGuard } from './access-control.guard';
import {
  REQUIRED_PERMISSIONS_METADATA,
  REQUIRED_ROLES_METADATA,
} from './access.metadata';

export function Authorize(options: {
  roles?: string[];
  permissions?: string[];
}): MethodDecorator & ClassDecorator {
  if (
    (!options.roles || options.roles.length === 0) &&
    (!options.permissions || options.permissions.length === 0)
  ) {
    throw new Error('Authorize exige ao menos um perfil ou uma permissão.');
  }

  const decorators: Array<ClassDecorator | MethodDecorator> = [
    UseGuards(JwtAuthGuard, AccessControlGuard),
  ];

  if (options.roles?.length) {
    decorators.push(SetMetadata(REQUIRED_ROLES_METADATA, options.roles));
  }

  if (options.permissions?.length) {
    decorators.push(
      SetMetadata(REQUIRED_PERMISSIONS_METADATA, options.permissions),
    );
  }

  return applyDecorators(...decorators);
}

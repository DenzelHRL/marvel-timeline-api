import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ControleAcessoGuard } from './controle-acesso.guard';
import {
  PERMISSOES_REQUERIDAS_METADATA,
  PERFIS_REQUERIDOS_METADATA,
} from './autorizacao.metadata';

export function Authorize(options: {
  roles?: string[];
  permissions?: string[];
}): MethodDecorator & ClassDecorator {
  if ((!options.roles || options.roles.length === 0) &&
    (!options.permissions || options.permissions.length === 0)) {
    throw new Error('Tenha pelo menos um perfil ou uma permissão.');
  }

  const decorators: Array<ClassDecorator | MethodDecorator> = [
    UseGuards(JwtAuthGuard, ControleAcessoGuard),
  ];

  if (options.roles?.length) {
    decorators.push(SetMetadata(PERFIS_REQUERIDOS_METADATA, options.roles));
  }

  if (options.permissions?.length) {
    decorators.push(
      SetMetadata(PERMISSOES_REQUERIDAS_METADATA, options.permissions),
    );
  }

  return applyDecorators(...decorators);
}

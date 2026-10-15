import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const UsuarioId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Pega do header x-usuario-id (ou futuramente do req.user do JWT)
    const usuarioId = request.headers['x-usuario-id'] || request.user?.id;

    if (!usuarioId) {
      throw new UnauthorizedException(
        'Informe o cabeçalho "x-usuario-id" com o UUID do usuário para testar.',
      );
    }

    return usuarioId;
  },
);
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DataSource } from 'typeorm';
import { JWT_SECRET_MIN_BYTES } from '../auth.constants';
import { AuthenticatedUser } from '../auth.types';

interface JwtPayload {
  sub?: unknown;
}

interface JwtPrincipalRow {
  id: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly dataSource: DataSource) {
    const secret = process.env.JWT_SECRET;

    if (!secret || Buffer.byteLength(secret, 'utf8') < JWT_SECRET_MIN_BYTES) {
      throw new Error(
        `JWT_SECRET deve conter pelo menos ${JWT_SECRET_MIN_BYTES} bytes em UTF-8.`,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (
      typeof payload.sub !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payload.sub,
      )
    ) {
      throw new UnauthorizedException(
        'O token JWT não contém um usuário válido.',
      );
    }

    const rows = await this.dataSource.query<JwtPrincipalRow[]>(
      `
        SELECT
          u.id,
          COALESCE(
            array_agg(DISTINCT p.codigo) FILTER (WHERE p.codigo IS NOT NULL),
            ARRAY[]::varchar[]
          ) AS roles,
          COALESCE(
            array_agg(DISTINCT permissao.codigo)
              FILTER (WHERE permissao.codigo IS NOT NULL),
            ARRAY[]::varchar[]
          ) AS permissions
        FROM usuarios u
        LEFT JOIN usuario_perfis up ON up.usuario_id = u.id
        LEFT JOIN perfis p ON p.id = up.perfil_id
        LEFT JOIN perfil_permissoes pp ON pp.perfil_id = p.id
        LEFT JOIN permissoes permissao ON permissao.id = pp.permissao_id
        WHERE u.id = $1 AND u.ativo = TRUE
        GROUP BY u.id
      `,
      [payload.sub],
    );

    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException('A conta não existe ou está desativada.');
    }

    return {
      id: user.id,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}

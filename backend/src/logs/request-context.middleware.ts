import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';
import type { AuthenticatedUser } from '../auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const inicio = performance.now();

    // 1. Gera ou preserva o requestId recebido via header
    const headerId = req.headers['x-request-id'];
    const requestId =
      typeof headerId === 'string' && headerId.trim()
        ? headerId.trim()
        : randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    let finalizado = false;

    const registrarAcesso = (statusFinal: number) => {
      if (finalizado) return;
      finalizado = true;

      const duracaoMs = Math.round((performance.now() - inicio) * 100) / 100;

      // 4. Usa template de rota quando disponivel e remove query string (evita vazar code OAuth / tokens)
      let rota = req.originalUrl ? req.originalUrl.split('?')[0] : req.url;
      if (req.baseUrl && req.route?.path) {
        rota = `${req.baseUrl}${req.route.path}`;
      } else if (req.route?.path) {
        rota = req.route.path;
      }

      // 3. Obtem usuario autenticado com seguranca a partir de req.user
      const usuario = req.user as AuthenticatedUser | undefined;
      const usuarioId = usuario?.id || null;

      this.logger.acesso({
        tipo: 'acesso',
        requestId,
        metodo: req.method,
        rota,
        statusHttp: statusFinal,
        duracaoMs,
        usuarioId,
        ip: req.ip || req.socket?.remoteAddress,
      });
    };

    // 2. Registra no termino normal da resposta
    res.on('finish', () => {
      registrarAcesso(res.statusCode);
    });

    // 2. Registra desconexao precoce caso o cliente feche a conexao antes do termino
    res.on('close', () => {
      if (!res.writableEnded) {
        registrarAcesso(499);
      }
    });

    next();
  }
}

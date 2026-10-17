import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import {
  AUDITORIA_METADATA_KEY,
  AuditoriaOpcoes,
} from './auditoria.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const opcoes = this.reflector.get<AuditoriaOpcoes>(
      AUDITORIA_METADATA_KEY,
      context.getHandler(),
    );

    // Se a rota nao possui o decorator @Auditar, segue o fluxo normal
    if (!opcoes) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const requestId = req.requestId || 'sem-id';
    const usuario = req.user as AuthenticatedUser | undefined;
    const usuarioId = usuario?.id || null;

    // Obtem o id do recurso via parametro de rota, caso especificado
    let recursoId: string | null = null;
    if (opcoes.idParam && req.params?.[opcoes.idParam]) {
      recursoId = String(req.params[opcoes.idParam]);
    }

    return next.handle().pipe(
      tap((resultadoDados) => {
        // Sucesso: operacao confirmada no banco
        // Se for criacao e nao havia param de rota, extrai o id do objeto retornado
        const idFinal =
          recursoId ||
          (resultadoDados && typeof resultadoDados === 'object' && 'id' in resultadoDados
            ? String((resultadoDados as { id: unknown }).id)
            : null);

        const statusHttp = res.statusCode || 200;

        this.logger.auditoria({
          tipo: 'auditoria',
          requestId,
          usuarioId,
          acao: opcoes.acao,
          recursoTipo: opcoes.recurso,
          recursoId: idFinal,
          resultado: 'concluido',
          statusHttp,
        });
      }),
      catchError((err: unknown) => {
        let statusHttp = 500;
        let resultado: 'rejeitado' | 'falhou' = 'falhou';

        if (err instanceof HttpException) {
          statusHttp = err.getStatus();
          // Erros 4xx sao rejeicoes de regra de negocio ou validacao
          if (statusHttp >= 400 && statusHttp < 500) {
            resultado = 'rejeitado';
          }
        }

        // Registra evento de auditoria com status de rejeicao ou falha
        this.logger.auditoria({
          tipo: 'auditoria',
          requestId,
          usuarioId,
          acao: opcoes.acao,
          recursoTipo: opcoes.recurso,
          recursoId,
          resultado,
          statusHttp,
        });

        // Se for falha inesperada (5xx), registra tambem no log de erro estruturado sem expor dados sensiveis
        if (resultado === 'falhou') {
          const erroNome = err instanceof Error ? err.name : 'UnknownError';
          this.logger.erro({
            tipo: 'erro',
            requestId,
            metodo: req.method,
            rota: req.originalUrl?.split('?')[0] || req.url,
            mensagem: 'Erro interno durante operacao administrativa auditada.',
            erroNome,
            statusHttp,
          });
        }

        // Preserva rigorosamente o erro e status originais da aplicacao
        return throwError(() => err);
      }),
    );
  }
}

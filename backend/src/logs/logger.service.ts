import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';

export interface EventoAcesso {
  tipo: 'acesso';
  requestId: string;
  metodo: string;
  rota: string;
  statusHttp: number;
  duracaoMs: number;
  usuarioId?: string | null;
  ip?: string;
}

export interface EventoAuditoria {
  tipo: 'auditoria';
  requestId: string;
  usuarioId: string | null;
  acao: string;
  recursoTipo: string;
  recursoId?: string | null;
  resultado: 'concluido' | 'rejeitado' | 'falhou';
  statusHttp: number;
  detalhes?: Record<string, unknown>;
}

export interface EventoErro {
  tipo: 'erro';
  requestId: string;
  metodo: string;
  rota: string;
  mensagem: string;
  erroNome: string;
  statusHttp: number;
  stackTrace?: string;
}

const CAMPOS_SENSIVEIS = new Set([
  'senha',
  'password',
  'token',
  'authorization',
  'cookie',
  'secret',
  'hashsenha',
  'hash_senha',
  'code',
]);

function sanitizarObjeto(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizarObjeto);
  }

  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(obj as Record<string, unknown>)) {
    if (CAMPOS_SENSIVEIS.has(chave.toLowerCase())) {
      resultado[chave] = '[REDUZIDO/CONFIDENCIAL]';
    } else if (typeof valor === 'object' && valor !== null) {
      resultado[chave] = sanitizarObjeto(valor);
    } else {
      resultado[chave] = valor;
    }
  }
  return resultado;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly winstonLogger: winston.Logger;

  constructor() {
    const logsDir = path.resolve(process.cwd(), 'logs');

    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
    } catch (err: unknown) {}

    const formatoSanitizado = winston.format((info) => {
      return sanitizarObjeto(info) as winston.Logform.TransformableInfo;
    });

    const apenasAuditoria = winston.format((info) => {
      const ehAuditoria =
        info.tipo === 'auditoria' ||
        (typeof info.message === 'object' &&
          info.message !== null &&
          (info.message as Record<string, unknown>).tipo === 'auditoria');
      return ehAuditoria ? info : false;
    });

    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        formatoSanitizado(),
        winston.format.json(),
      ),
    });

    const fileAppTransport = new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        formatoSanitizado(),
        winston.format.json(),
      ),
    });

    const fileErrorTransport = new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        formatoSanitizado(),
        winston.format.json(),
      ),
    });

    const fileAuditTransport = new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        apenasAuditoria(),
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        formatoSanitizado(),
        winston.format.json(),
      ),
    });

    const transports = [
      consoleTransport,
      fileAppTransport,
      fileErrorTransport,
      fileAuditTransport,
    ];

    for (const transport of transports) {
      transport.on('error', (err: Error) => {
        process.stderr.write(`[Winston Transport Warning]: ${err?.message || err}\n`);
      });
    }

    this.winstonLogger = winston.createLogger({
      level: 'info',
      transports,
      exitOnError: false,
    });
  }

  acesso(dados: EventoAcesso): void {
    try {
      this.winstonLogger.info(dados);
    } catch {}
  }

  auditoria(dados: EventoAuditoria): void {
    try {
      this.winstonLogger.info(dados);
    } catch {}
  }

  erro(dados: EventoErro): void {
    try {
      this.winstonLogger.error(dados);
    } catch {}
  }

  log(message: string, context?: string): void {
    try {
      this.winstonLogger.info({ mensagem: message, contexto: context });
    } catch {}
  }

  error(message: string, trace?: string, context?: string): void {
    try {
      this.winstonLogger.error({ mensagem: message, trace, contexto: context });
    } catch {}
  }

  warn(message: string, context?: string): void {
    try {
      this.winstonLogger.warn({ mensagem: message, contexto: context });
    } catch {}
  }

  debug(message: string, context?: string): void {
    try {
      this.winstonLogger.debug({ mensagem: message, contexto: context });
    } catch {}
  }

  verbose(message: string, context?: string): void {
    try {
      this.winstonLogger.verbose({ mensagem: message, contexto: context });
    } catch {}
  }
}

import { config as carregarEnv } from 'dotenv';

carregarEnv();

export const PREFIXO_FILAS = 'mt-filas';

export function opcoesConexaoRedis(maxRetriesPerRequest: number | null) {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    connectTimeout: 1_000,
    maxRetriesPerRequest,
    retryStrategy: (tentativas: number) => Math.min(tentativas * 250, 1_000),
  };
}

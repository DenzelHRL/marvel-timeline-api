import { config as carregarEnv } from 'dotenv';
import { createClient } from 'redis';

carregarEnv();

export const PREFIXO_FILAS = 'mt-filas';

export function opcoesConexaoRedis(
  maxRetriesPerRequest: number | null,
): ReturnType<typeof createClient> {
  const cliente = createClient({
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      connectTimeout: 1_000,
      reconnectStrategy:
        maxRetriesPerRequest === null
          ? (tentativas: number) => Math.min(tentativas * 250, 1_000)
          : false,
    },
  });

  // Evita que a ausência temporária do Redis gere unhandled rejection.
  cliente.on('error', () => undefined);
  return cliente;
}

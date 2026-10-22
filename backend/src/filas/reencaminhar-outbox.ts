import { AppDataSource } from '../database/data-source';

interface ResultadoReenvio {
  quantidade: number;
}

const REABRIR_ULTIMOS_EVENTOS = `
  WITH ultimos_eventos AS (
    SELECT DISTINCT ON (trilha_id) event_id
    FROM mapa_outbox
    ORDER BY trilha_id, versao DESC, criado_em DESC
  ), reabertos AS (
    UPDATE mapa_outbox AS evento
    SET enfileirado_em = NULL,
        relay_claim_token = NULL,
        relay_claim_expira_em = NULL
    FROM ultimos_eventos AS ultimo
    WHERE evento.event_id = ultimo.event_id
    RETURNING evento.event_id
  )
  SELECT count(*)::int AS quantidade FROM reabertos
`;

async function reencaminharUltimosEventos(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const [resultado] = await AppDataSource.query<ResultadoReenvio[]>(REABRIR_ULTIMOS_EVENTOS);

    console.info(
      `Eventos recentes reabertos para reenvio: ${resultado?.quantidade ?? 0}. Execute após perder ou recriar os dados da fila Redis.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

void reencaminharUltimosEventos().catch((erro: unknown) => {
  const nomeErro = erro instanceof Error ? erro.name : 'Erro desconhecido';
  console.error(`Não foi possível reabrir eventos da outbox: ${nomeErro}`);
  process.exitCode = 1;
});

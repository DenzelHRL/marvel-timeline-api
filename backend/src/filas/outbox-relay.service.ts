import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { ReconstruirMapaJob } from '../bonus/contratos';
import { MapaProdutor } from './mapa.produtor';

const TAMANHO_LOTE = 50;
const INTERVALO_POLL_MS = 5_000;
const PRAZO_ENQUEUE_MS = 5_000;
const DURACAO_CLAIM_SEGUNDOS = 300;

const CONSULTAR_PENDENCIAS = `
  WITH selecionados AS (
    SELECT event_id FROM mapa_outbox
    WHERE enfileirado_em IS NULL
      AND (relay_claim_expira_em IS NULL OR relay_claim_expira_em <= now())
    ORDER BY criado_em ASC, event_id ASC
    LIMIT $1 FOR UPDATE SKIP LOCKED
  )
  UPDATE mapa_outbox AS evento
  SET relay_claim_token = $2::uuid,
      relay_claim_expira_em = now() + ($3 * interval '1 second')
  FROM selecionados
  WHERE evento.event_id = selecionados.event_id
  RETURNING evento.event_id::text AS "eventId",
    evento.trilha_id::text AS "trilhaId", evento.versao::text AS versao
`;
const MARCAR_ENFILEIRADO = `
  UPDATE mapa_outbox SET enfileirado_em = now(), relay_claim_token = NULL,
    relay_claim_expira_em = NULL
  WHERE event_id = $1::uuid AND relay_claim_token = $2::uuid
    AND enfileirado_em IS NULL
`;
const LIBERAR_CLAIMS = `
  UPDATE mapa_outbox SET relay_claim_token = NULL, relay_claim_expira_em = NULL
  WHERE relay_claim_token = $1::uuid AND enfileirado_em IS NULL
`;

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private ativo = false;
  private cicloEmAndamento = false;
  private timer?: NodeJS.Timeout;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly produtor: MapaProdutor,
  ) {}

  onModuleInit(): void {
    this.ativo = true;
    this.agendar(0);
  }

  onModuleDestroy(): void {
    this.ativo = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  async processarLote(): Promise<number> {
    const claimToken = randomUUID();
    const [pendencias] = await this.dataSource.transaction((manager) =>
      manager.query<[ReconstruirMapaJob[], number]>(
        CONSULTAR_PENDENCIAS,
        [TAMANHO_LOTE, claimToken, DURACAO_CLAIM_SEGUNDOS],
      ),
    );

    let enfileirados = 0;
    try {
      for (const evento of pendencias) {
        try {
          await this.enfileirarComPrazo(evento);
          await this.dataSource.query(MARCAR_ENFILEIRADO, [evento.eventId, claimToken]);
          enfileirados += 1;
        } catch (erro) {
          this.logger.warn(
            `Relay manteve evento pendente: eventId=${evento.eventId} trilhaId=${evento.trilhaId} erro=${this.resumirErro(erro)}`,
          );
          break;
        }
      }
    } finally {
      await this.dataSource.query(LIBERAR_CLAIMS, [claimToken]);
    }

    return enfileirados;
  }

  private async enfileirarComPrazo(evento: ReconstruirMapaJob): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.produtor.enfileirar(evento),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Prazo de enqueue excedido.')),
            PRAZO_ENQUEUE_MS,
          );
          timer.unref?.();
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private agendar(atrasoMs: number): void {
    if (!this.ativo || this.cicloEmAndamento) {
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.executarCiclo();
    }, atrasoMs);
    this.timer.unref?.();
  }

  private async executarCiclo(): Promise<void> {
    if (!this.ativo || this.cicloEmAndamento) {
      return;
    }

    this.cicloEmAndamento = true;
    let proximoAtraso = INTERVALO_POLL_MS;
    try {
      if ((await this.processarLote()) === TAMANHO_LOTE) {
        proximoAtraso = 0;
      }
    } catch (erro) {
      this.logger.warn(`Falha ao consultar a outbox: ${this.resumirErro(erro)}`);
    } finally {
      this.cicloEmAndamento = false;
      this.agendar(proximoAtraso);
    }
  }

  private resumirErro(erro: unknown): string {
    if (erro instanceof Error) {
      return erro.name;
    }
    return 'erro desconhecido';
  }
}

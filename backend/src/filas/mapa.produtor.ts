import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  FILA_MAPA,
  JOB_RECONSTRUIR_MAPA,
  ReconstruirMapaJob,
} from '../bonus/contratos';

@Injectable()
export class MapaProdutor {
  private readonly logger = new Logger(MapaProdutor.name);

  constructor(
    @InjectQueue(FILA_MAPA)
    private readonly fila: Queue<ReconstruirMapaJob>,
  ) {}

  async enfileirar(evento: ReconstruirMapaJob): Promise<void> {
    await this.fila.add(JOB_RECONSTRUIR_MAPA, evento, {
      jobId: evento.eventId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 1_000 },
    });

    this.logger.log(
      `Mapa enfileirado: eventId=${evento.eventId} trilhaId=${evento.trilhaId} versao=${evento.versao}`,
    );
  }
}

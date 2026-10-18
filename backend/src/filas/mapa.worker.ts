import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import {
  FILA_MAPA,
  JOB_RECONSTRUIR_MAPA,
  ReconstruirMapaJob,
} from '../bonus/contratos';
import { ProjecaoMapaService } from '../projecao-mapa/projecao-mapa.service';
import { opcoesConexaoRedis, PREFIXO_FILAS } from './redis-filas.config';

const UUID_CANONICO = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VERSAO_DECIMAL_POSITIVA = /^[1-9][0-9]*$/;

@Injectable()
@Processor(FILA_MAPA, {
  connection: opcoesConexaoRedis(null),
  prefix: PREFIXO_FILAS,
  concurrency: 1,
})
export class MapaWorker extends WorkerHost {
  private readonly logger = new Logger(MapaWorker.name);

  constructor(private readonly projecao: ProjecaoMapaService) {
    super();
  }

  async process(job: Job<ReconstruirMapaJob>): Promise<void> {
    if (job.name !== JOB_RECONSTRUIR_MAPA) {
      throw new UnrecoverableError(`Tipo de job não suportado: ${job.name}`);
    }

    const evento = job.data;
    if (
      !evento ||
      typeof evento.eventId !== 'string' ||
      typeof evento.trilhaId !== 'string' ||
      typeof evento.versao !== 'string' ||
      !UUID_CANONICO.test(evento.eventId) ||
      !UUID_CANONICO.test(evento.trilhaId) ||
      !VERSAO_DECIMAL_POSITIVA.test(evento.versao)
    ) {
      throw new UnrecoverableError('Payload inválido para reconstrução do mapa.');
    }

    await this.projecao.reconstruir(evento.trilhaId);
    this.logger.log(
      `Mapa reconstruído: eventId=${evento.eventId} trilhaId=${evento.trilhaId} versao=${evento.versao}`,
    );
  }

  @OnWorkerEvent('active')
  aoIniciar(job: Job<ReconstruirMapaJob>): void {
    this.logger.log(
      `Reconstrução iniciada: tentativa=${job.attemptsMade + 1} jobId=${job.id} eventId=${job.data?.eventId ?? 'inválido'} trilhaId=${job.data?.trilhaId ?? 'inválido'} versao=${job.data?.versao ?? 'inválida'}`,
    );
  }

  @OnWorkerEvent('failed')
  aoFalhar(job: Job<ReconstruirMapaJob> | undefined, erro: Error): void {
    if (!job) {
      return;
    }

    const tentativas = job.opts.attempts ?? 1;
    const contexto = `tentativa=${job.attemptsMade}/${tentativas} jobId=${job.id} eventId=${job.data?.eventId ?? 'inválido'} trilhaId=${job.data?.trilhaId ?? 'inválido'} versao=${job.data?.versao ?? 'inválida'} erro=${erro.name}`;
    if (job.attemptsMade >= tentativas) {
      this.logger.error(`Falha final na reconstrução: ${contexto}`);
      return;
    }
    this.logger.warn(`Tentativa de reconstrução falhou: ${contexto}`);
  }
}

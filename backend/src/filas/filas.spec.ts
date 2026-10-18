import { Job, Queue, UnrecoverableError } from 'bullmq';
import { DataSource } from 'typeorm';
import { ReconstruirMapaJob } from '../bonus/contratos';
import { ProjecaoMapaService } from '../projecao-mapa/projecao-mapa.service';
import { MapaProdutor } from './mapa.produtor';
import { MapaWorker } from './mapa.worker';
import { OutboxRelayService } from './outbox-relay.service';

describe('filas do mapa', () => {
  const evento: ReconstruirMapaJob = {
    eventId: '2b6b6ed9-fb42-4ea6-9f1b-3d43b02d995a',
    trilhaId: 'f7bc8e2d-446e-42ca-91a2-2e8f46d91062',
    versao: '9007199254740993',
  };

  it('usa eventId como jobId e permite reenviar o mesmo evento', async () => {
    const fila = { add: jest.fn().mockResolvedValue(undefined) };
    const produtor = new MapaProdutor(
      fila as unknown as Queue<ReconstruirMapaJob>,
    );

    await produtor.enfileirar(evento);
    await produtor.enfileirar(evento);

    expect(fila.add).toHaveBeenCalledTimes(2);
    expect(fila.add).toHaveBeenNthCalledWith(
      1,
      'reconstruir-mapa',
      evento,
      expect.objectContaining({
        jobId: evento.eventId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1_000 },
      }),
    );
  });

  it('reconstrói a trilha do payload e deixa falhas tentáveis subirem', async () => {
    const reconstruir = jest.fn().mockRejectedValueOnce(new Error('temporário'));
    const worker = new MapaWorker({ reconstruir } as unknown as ProjecaoMapaService);
    const job = {
      name: 'reconstruir-mapa',
      data: evento,
    } as Job<ReconstruirMapaJob>;

    await expect(worker.process(job)).rejects.toThrow('temporário');
    expect(reconstruir).toHaveBeenCalledWith(evento.trilhaId);
  });

  it('rejeita payload inválido como falha não recuperável', async () => {
    const reconstruir = jest.fn();
    const worker = new MapaWorker({ reconstruir } as unknown as ProjecaoMapaService);
    const job = {
      name: 'reconstruir-mapa',
      data: { ...evento, versao: '9x' },
    } as Job<ReconstruirMapaJob>;

    await expect(worker.process(job)).rejects.toBeInstanceOf(UnrecoverableError);
    expect(reconstruir).not.toHaveBeenCalled();
  });

  it('exige versão serializada como string decimal', async () => {
    const reconstruir = jest.fn();
    const worker = new MapaWorker({ reconstruir } as unknown as ProjecaoMapaService);
    const job = {
      name: 'reconstruir-mapa',
      data: { ...evento, versao: 9 },
    } as unknown as Job<ReconstruirMapaJob>;

    await expect(worker.process(job)).rejects.toBeInstanceOf(UnrecoverableError);
    expect(reconstruir).not.toHaveBeenCalled();
  });

  it('marca a outbox somente depois do enqueue confirmado', async () => {
    const dataSource = {
      transaction: jest.fn(
        async (callback: (manager: { query: jest.Mock }) => Promise<unknown>) =>
          callback({ query: jest.fn().mockResolvedValueOnce([[evento], 1]) }),
      ),
      query: jest.fn().mockResolvedValue([]),
    };
    const enfileirar = jest.fn().mockResolvedValue(undefined);
    const relay = new OutboxRelayService(
      dataSource as unknown as DataSource,
      { enfileirar } as unknown as MapaProdutor,
    );

    await expect(relay.processarLote()).resolves.toBe(1);
    expect(enfileirar).toHaveBeenCalledWith(evento);
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE mapa_outbox'),
      [evento.eventId, expect.any(String)],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('relay_claim_token = NULL'),
      [expect.any(String)],
    );
  });

  it('mantém a pendência se o enqueue falhar', async () => {
    const dataSource = {
      transaction: jest.fn(
        async (callback: (manager: { query: jest.Mock }) => Promise<unknown>) =>
          callback({ query: jest.fn().mockResolvedValueOnce([[evento], 1]) }),
      ),
      query: jest.fn().mockResolvedValue([]),
    };
    const enfileirar = jest.fn().mockRejectedValue(new Error('Redis indisponível'));
    const relay = new OutboxRelayService(
      dataSource as unknown as DataSource,
      { enfileirar } as unknown as MapaProdutor,
    );

    await expect(relay.processarLote()).resolves.toBe(0);
    expect(dataSource.query).toHaveBeenCalledTimes(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('relay_claim_token = NULL'),
      [expect.any(String)],
    );
  });
});

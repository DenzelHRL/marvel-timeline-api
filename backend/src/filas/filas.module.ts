import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FILA_MAPA } from '../bonus/contratos';
import { CatalogoRevisaoModule } from '../catalogo-revisao/catalogo-revisao.module';
import { ProjecaoMapaModule } from '../projecao-mapa/projecao-mapa.module';
import { MapaProdutor } from './mapa.produtor';
import { MapaWorker } from './mapa.worker';
import { OutboxRelayService } from './outbox-relay.service';
import { opcoesConexaoRedis, PREFIXO_FILAS } from './redis-filas.config';

@Module({})
export class FilasModule {
  static register(): DynamicModule {
    if (process.env.FILAS_ENABLED !== 'true') {
      return { module: FilasModule };
    }

    return {
      module: FilasModule,
      imports: [
        BullModule.forRoot({
          connection: opcoesConexaoRedis(1),
          prefix: PREFIXO_FILAS,
        }),
        BullModule.registerQueue({ name: FILA_MAPA }),
        CatalogoRevisaoModule,
        ProjecaoMapaModule,
      ],
      providers: [MapaProdutor, OutboxRelayService, MapaWorker],
    };
  }
}

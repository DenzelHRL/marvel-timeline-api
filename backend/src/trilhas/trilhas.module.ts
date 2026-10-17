import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AcessoModule } from '../acesso/acesso.module';
import { CatalogoRevisaoModule } from '../catalogo-revisao/catalogo-revisao.module';
import { ProjecaoMapaModule } from '../projecao-mapa/projecao-mapa.module';
import {
  Trilha,
  EtapaTrilha,
} from '../database/entities/catalog.entities';
import { TrilhasController } from './trilhas.controller';
import { ExplorarController } from './explorar.controller';
import { TrilhasService } from './trilhas.service';
import { EtapasTrilhaService } from './etapas-trilha.service';
import { ConsultarMapaHandler } from './queries/consultar-mapa.handler';
import { ReordenarEtapasHandler } from './commands/reordenar-etapas.handler';

@Module({
  imports: [
    // Buses para encaminhar comandos e consultas.
    CqrsModule.forRoot(),
    TypeOrmModule.forFeature([Trilha, EtapaTrilha]),
    AuthModule,
    AcessoModule,
    CatalogoRevisaoModule,
    ProjecaoMapaModule,
  ],
  controllers: [
    TrilhasController,
    ExplorarController,
  ],
  providers: [
    TrilhasService,
    EtapasTrilhaService,

    // Lado de leitura: consulta do mapa.
    ConsultarMapaHandler,

    // Lado de escrita: alteração da ordem das etapas.
    ReordenarEtapasHandler,
  ],
})
export class TrilhasModule {}
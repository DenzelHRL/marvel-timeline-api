import { Module } from '@nestjs/common';
import { CatalogoRevisaoModule } from '../catalogo-revisao/catalogo-revisao.module';
import { BancoLeituraService } from './banco-leitura.service';
import { ProjecaoMapaService } from './projecao-mapa.service';
import { MapaLeituraService } from './mapa-leitura.service';

@Module({
  imports: [CatalogoRevisaoModule],
  providers: [
    BancoLeituraService,
    ProjecaoMapaService,
    MapaLeituraService,
  ],
  exports: [
    BancoLeituraService,
    ProjecaoMapaService,
    MapaLeituraService,
  ],
})
export class ProjecaoMapaModule {}
import { Module } from '@nestjs/common';
import { CatalogoRevisaoService } from './catalogo-revisao.service';

@Module({
  providers: [CatalogoRevisaoService],
  exports: [CatalogoRevisaoService],
})
export class CatalogoRevisaoModule {}

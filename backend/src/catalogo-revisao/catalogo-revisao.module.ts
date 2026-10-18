import { Module } from '@nestjs/common';
import { CatalogoRevisaoService } from './catalogo-revisao.service';

@Module({
  providers: [CatalogoRevisaoService],

  // Permite compartilhar o mesmo controle entre trilhas, obras e projeção.
  exports: [CatalogoRevisaoService],
})
export class CatalogoRevisaoModule {}
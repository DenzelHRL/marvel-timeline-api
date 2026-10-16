import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EtapaTrilha,
  Obra,
  Serie,
  Trilha,
} from '../database/entities/catalog.entities';
import { ObrasController } from './obras.controller';
import { ObrasService } from './obras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Obra, Serie, Trilha, EtapaTrilha])],
  controllers: [ObrasController],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}

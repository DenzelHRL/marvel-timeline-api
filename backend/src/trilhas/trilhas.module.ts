import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrilhasController } from './trilhas.controller';
import { TrilhasService } from './trilhas.service';
import {
  Trilha,
  EtapaTrilha,
} from '../database/entities/catalog.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Trilha, EtapaTrilha])],
  controllers: [TrilhasController],
  providers: [TrilhasService],
})
export class TrilhasModule {}
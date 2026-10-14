import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra, Serie } from '../database/entities/catalog.entities';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';

@Module({
  imports: [TypeOrmModule.forFeature([Serie, Obra])],
  controllers: [SeriesController],
  providers: [SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}

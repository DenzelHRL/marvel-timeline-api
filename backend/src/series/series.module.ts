import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AcessoModule } from '../acesso/acesso.module';
import { Obra, Serie } from '../database/entities/catalog.entities';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Serie, Obra]),
    AuthModule,
    AcessoModule,
  ],
  controllers: [SeriesController],
  providers: [SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}

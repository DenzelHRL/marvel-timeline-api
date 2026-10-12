import { Module } from '@nestjs/common';
import { TrilhasController } from './trilhas.controller';
import { TrilhasService } from './trilhas.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trilha } from '../database/entities/catalog.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Trilha])],
  controllers: [TrilhasController],
  providers: [TrilhasService]
})
export class TrilhasModule {}



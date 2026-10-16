import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AcessoModule } from '../acesso/acesso.module';
import {
  Trilha,
  EtapaTrilha,
} from '../database/entities/catalog.entities';
import { TrilhasController } from './trilhas.controller';
import { ExplorarController } from './explorar.controller';
import { TrilhasService } from './trilhas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trilha, EtapaTrilha]),
    AuthModule,
    AcessoModule,
  ],
  controllers: [TrilhasController, ExplorarController],
  providers: [TrilhasService],
})
export class TrilhasModule {}
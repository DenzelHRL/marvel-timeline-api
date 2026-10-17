import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AcessoModule } from '../acesso/acesso.module';
import {
  EtapaTrilha,
  Obra,
  Serie,
  Trilha,
} from '../database/entities/catalog.entities';
import { ObrasController } from './obras.controller';
import { ObrasService } from './obras.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Obra, Serie, Trilha, EtapaTrilha]),
    AuthModule,
    AcessoModule,
  ],
  controllers: [ObrasController],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra } from '../database/entities/catalog.entities';
import { ObrasService } from './obras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Obra])],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}

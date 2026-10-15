import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database/data-source';
import { TrilhasModule } from './trilhas/trilhas.module';
import { SeriesModule } from './series/series.module';
import { ObrasModule } from './obras/obras.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    TrilhasModule,
    SeriesModule,
    ObrasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

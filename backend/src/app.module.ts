import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcessoModule } from './acesso/acesso.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { databaseOptions } from './database/data-source';
import { ComentariosModule } from './comentarios/comentarios.module';
import { TrilhasModule } from './trilhas/trilhas.module';
import { SeriesModule } from './series/series.module';
import { ObrasModule } from './obras/obras.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    LogsModule,
    AuthModule,
    AcessoModule,
    ComentariosModule,
    TrilhasModule,
    SeriesModule,
    ObrasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database/data-source';
import { ComentariosModule } from './comentarios/comentarios.module';
import { TrilhasModule } from './trilhas/trilhas.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    ComentariosModule,
    TrilhasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
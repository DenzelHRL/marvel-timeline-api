import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcessoModule } from './acesso/acesso.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { databaseOptions } from './database/data-source';
import { PersonagensModule } from './personagens/personagens.module';
import { TrilhasModule } from './trilhas/trilhas.module';
import { ComentariosModule } from './comentarios/comentarios.module';

@Module({
  imports: [
    
    TypeOrmModule.forRoot(databaseOptions()),
    PersonagensModule,
    AuthModule,
    AcessoModule,
    ComentariosModule,
    TrilhasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
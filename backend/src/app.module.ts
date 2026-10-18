import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcessoModule } from './acesso/acesso.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { databaseOptions } from './database/data-source';
import { PersonagensModule } from './personagens/personagens.module';
import { TrilhasModule } from './trilhas/trilhas.module';
import { SeriesModule } from './series/series.module';
import { ObrasModule } from './obras/obras.module';
import { LogsModule } from './logs/logs.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { ParticipacaoModule } from './participacoes/participacao.module';
import { AcontecimentosModule } from './acontecimentos/acontecimentos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProgressoModule } from './progresso/progresso.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    LogsModule,
    PersonagensModule,
    ParticipacaoModule,
    AcontecimentosModule,
    AuthModule,
    AcessoModule,
    ComentariosModule,
    TrilhasModule,
    SeriesModule,
    ObrasModule,
    UsuariosModule,
    ProgressoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
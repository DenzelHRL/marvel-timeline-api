import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcessoModule } from './acesso/acesso.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { databaseOptions } from './database/data-source';
import { ComentariosModule } from './comentarios/comentarios.module';
import { TrilhasModule } from './trilhas/trilhas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProgressoModule } from './progresso/progresso.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    CacheModule,
    AuthModule,
    AcessoModule,
    ComentariosModule,
    TrilhasModule,
    UsuariosModule,
    ProgressoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
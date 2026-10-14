import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Usuario,
  Perfil,
  Permissao,
  UsuarioPerfil,
  PerfilPermissao,
} from '../database/entities';
import { AcessoController } from './acesso.controller';
import { ControleAcessoGuard } from './controle-acesso.guard';
import { AcessoService } from './acesso.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Usuario,
      Perfil,
      Permissao,
      UsuarioPerfil,
      PerfilPermissao,
    ]),
  ],
  controllers: [AcessoController],
  providers: [AcessoService, ControleAcessoGuard],
  exports: [ControleAcessoGuard],
})
export class AcessoModule {}

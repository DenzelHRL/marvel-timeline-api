import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Usuario,
  Perfil,
  Permissao,
  UsuarioPerfil,
  PerfilPermissao,
} from '../database/entities';
import { AcessoController } from './acesso.controller';
import { AcessoService } from './acesso.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Perfil, Permissao, UsuarioPerfil, PerfilPermissao,]),
  ],
  controllers: [AcessoController],
  providers: [AcessoService],
})
export class AcessoModule {}

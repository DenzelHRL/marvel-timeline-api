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
import { AccessControlGuard } from './access-control.guard';
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
  providers: [AcessoService, AccessControlGuard],
  exports: [AccessControlGuard],
})
export class AcessoModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario, Perfil, UsuarioPerfil } from '../database/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Perfil, UsuarioPerfil])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

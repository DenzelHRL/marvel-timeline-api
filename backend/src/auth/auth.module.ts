import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario, Perfil, UsuarioPerfil } from '../database/entities';
import { AuthController } from './auth.controller';
import {
  JWT_EXPIRATION_SECONDS,
  JWT_SECRET_MIN_BYTES,
} from './auth.constants';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Perfil, UsuarioPerfil]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (
          !secret ||
          Buffer.byteLength(secret, 'utf8') < JWT_SECRET_MIN_BYTES
        ) {
          throw new Error(
            `JWT_SECRET deve conter pelo menos ${JWT_SECRET_MIN_BYTES} bytes em UTF-8.`,
          );
        }

        return {
          secret,
          signOptions: {
            algorithm: 'HS256',
            expiresIn: JWT_EXPIRATION_SECONDS,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}

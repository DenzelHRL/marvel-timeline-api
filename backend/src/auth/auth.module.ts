import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JWT_EXPIRATION_SECONDS, JWT_SECRET_MIN_BYTES } from './auth.constants';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { GoogleAuthGuard } from './google/google-auth.guard';
import { getGoogleOAuthConfiguration } from './google/google-oauth.config';
import { GoogleStrategy } from './google/google.strategy';

const googleOAuthProviders = getGoogleOAuthConfiguration()
  ? [GoogleStrategy]
  : [];

@Module({
  imports: [
    PassportModule.register({ session: false }),
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
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    GoogleAuthGuard,
    ...googleOAuthProviders,
  ],
  exports: [JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule {}

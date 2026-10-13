import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { getGoogleOAuthConfiguration } from './google-oauth.config';

export interface GoogleAuthProfile {
  id: string;
  nome: string;
  email: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const configuration = getGoogleOAuthConfiguration();

    if (!configuration) {
      throw new Error(
        'A estratégia Google não pode ser iniciada sem configuração OAuth válida.',
      );
    }

    super({
      clientID: configuration.clientId,
      clientSecret: configuration.clientSecret,
      callbackURL: configuration.callbackUrl,
      scope: ['email', 'profile'],
      state: true,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleAuthProfile {
    const email = profile.emails?.find((item) => item.verified)?.value;

    if (!profile.id || !email) {
      throw new UnauthorizedException(
        'O Google não forneceu um identificador e um e-mail verificado.',
      );
    }

    return {
      id: profile.id,
      nome: profile.displayName,
      email,
    };
  }
}

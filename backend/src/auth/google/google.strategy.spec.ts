import { UnauthorizedException } from '@nestjs/common';
import { Profile } from 'passport-google-oauth20';
import { GoogleStrategy } from './google.strategy';

describe('Estratégia Google', () => {
  const variableNames = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'JWT_SECRET',
  ] as const;
  const originalValues = new Map(
    variableNames.map((name) => [name, process.env[name]]),
  );
  let strategy: GoogleStrategy;

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_CALLBACK_URL =
      'http://localhost:3000/auth/google/callback';
    process.env.JWT_SECRET = 'x'.repeat(32);
    strategy = new GoogleStrategy();
  });

  afterAll(() => {
    for (const name of variableNames) {
      const originalValue = originalValues.get(name);
      if (originalValue === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = originalValue;
      }
    }
  });

  const profile = (emailVerified: boolean): Profile => ({
    provider: 'google',
    id: 'google-user-123',
    displayName: 'Maria Silva',
    profileUrl: 'https://profiles.google.test/google-user-123',
    emails: [{ value: 'maria@exemplo.test', verified: emailVerified }],
    _raw: '{}',
    _json: {
      iss: 'https://accounts.google.com',
      aud: 'client-id',
      sub: 'google-user-123',
      iat: 1,
      exp: 2,
    },
  });

  it('aceita e retorna somente dados mínimos com e-mail verificado', () => {
    expect(
      strategy.validate('access-token', 'refresh-token', profile(true)),
    ).toEqual({
      id: 'google-user-123',
      nome: 'Maria Silva',
      email: 'maria@exemplo.test',
    });
  });

  it('rejeita perfil sem e-mail verificado', () => {
    expect(() =>
      strategy.validate('access-token', 'refresh-token', profile(false)),
    ).toThrow(UnauthorizedException);
  });
});

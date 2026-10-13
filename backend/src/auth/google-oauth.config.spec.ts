import {
  getGoogleOAuthConfiguration,
  GOOGLE_OAUTH_STATE_SECRET_CONTEXT,
} from './google-oauth.config';
import { createHmac } from 'node:crypto';
import { JWT_SECRET_MIN_BYTES } from './auth.constants';

describe('Configuração OAuth Google', () => {
  const variableNames = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'JWT_SECRET',
  ] as const;
  const originalValues = new Map(
    variableNames.map((name) => [name, process.env[name]]),
  );

  beforeEach(() => {
    for (const name of variableNames) delete process.env[name];
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

  it('fica desabilitada sem credenciais, sem impedir o início da API', () => {
    expect(getGoogleOAuthConfiguration()).toBeUndefined();
  });

  it('usa o JWT_SECRET existente e exige pelo menos 32 bytes', () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.JWT_SECRET = 'curto';

    expect(getGoogleOAuthConfiguration()).toBeUndefined();
    expect(JWT_SECRET_MIN_BYTES).toBe(32);
  });

  it('aceita callback HTTPS configurado e define o callback local por padrão', () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.JWT_SECRET = 'x'.repeat(32);
    const stateSecret = createHmac('sha256', process.env.JWT_SECRET)
      .update(GOOGLE_OAUTH_STATE_SECRET_CONTEXT)
      .digest('hex');

    expect(getGoogleOAuthConfiguration()).toEqual({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      callbackUrl: 'http://localhost:3000/auth/google/callback',
      stateSecret,
    });

    process.env.GOOGLE_CALLBACK_URL =
      'https://api.example.test/auth/google/callback';
    expect(getGoogleOAuthConfiguration()?.callbackUrl).toBe(
      'https://api.example.test/auth/google/callback',
    );
  });

  it('rejeita callback HTTP fora de localhost', () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.GOOGLE_CALLBACK_URL =
      'http://api.example.test/auth/google/callback';

    expect(getGoogleOAuthConfiguration()).toBeUndefined();
  });
});

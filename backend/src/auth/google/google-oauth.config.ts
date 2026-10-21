import { createHmac } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { JWT_SECRET_MIN_BYTES } from '../auth.constants';

loadEnv({ quiet: true });

export interface GoogleOAuthConfiguration {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  stateSecret: string;
}

export const GOOGLE_OAUTH_STATE_COOKIE_MAX_AGE = 10 * 60 * 1000;
export const GOOGLE_OAUTH_STATE_SECRET_CONTEXT = 'google-oauth-state-cookie';

export function getGoogleOAuthConfiguration():
  GoogleOAuthConfiguration | undefined {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const jwtSecret = process.env.JWT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim() || 'http://localhost:3000/auth/google/callback';

  if (
    !clientId ||
    !clientSecret ||
    !jwtSecret ||
    Buffer.byteLength(jwtSecret, 'utf8') < JWT_SECRET_MIN_BYTES ||
    !URL.canParse(callbackUrl)
  ) {
    return undefined;
  }

  const stateSecret = createHmac('sha256', jwtSecret)
    .update(GOOGLE_OAUTH_STATE_SECRET_CONTEXT)
    .digest('hex');

  return {
    clientId,
    clientSecret,
    callbackUrl,
    stateSecret,
  };
}

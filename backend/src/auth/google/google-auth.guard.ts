import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { getGoogleOAuthConfiguration } from './google-oauth.config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    if (!getGoogleOAuthConfiguration()) {
      throw new ServiceUnavailableException(
        'Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e JWT_SECRET no .env, além de uma GOOGLE_CALLBACK_URL HTTPS ou localhost válida, para habilitar o login Google.',
      );
    }

    return super.canActivate(context);
  }
}

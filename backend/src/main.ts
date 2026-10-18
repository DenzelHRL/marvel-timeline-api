import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieSession from 'cookie-session';
import passport from 'passport';
import {
  getGoogleOAuthConfiguration,
  GOOGLE_OAUTH_STATE_COOKIE_MAX_AGE,
} from './auth/google/google-oauth.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const googleOAuthConfiguration = getGoogleOAuthConfiguration();
  if (googleOAuthConfiguration) {
    app.use(
      cookieSession({
        name: 'google_oauth_state',
        keys: [googleOAuthConfiguration.stateSecret],
        maxAge: GOOGLE_OAUTH_STATE_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/auth/google',
      }),
    );
  }
  app.use(passport.initialize());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Marvel Timeline API')
    .setDescription(
      'API para explorar a linha do tempo do Universo Cinematográfico Marvel, com controle de spoilers, trilhas, personagens e acontecimentos.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Documentação Swagger disponível em: http://localhost:3000/api`);
}
void bootstrap();

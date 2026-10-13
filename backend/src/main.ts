import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
);

const config = new DocumentBuilder()
  .setTitle('Marvel Timeline API')
  .setDescription('API para explorar obras e trilhas da Marvel.')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config);

SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

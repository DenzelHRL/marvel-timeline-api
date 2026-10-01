import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger' 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Marvel Timeline API')
    .setDescription('API para explorar a linha do tempo do Universo Cinematográfico Marvel, com controle de spoilers, trilhas, personagens e acontecimentos.')
    .setVersion('1.0')
    .addTag('status', 'Rotas de saúde e verificação ds API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

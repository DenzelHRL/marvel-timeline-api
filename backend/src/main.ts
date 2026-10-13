import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger' 
import {ValidationPipe} from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true}));
  const config = new DocumentBuilder()
    .setTitle('Marvel Timeline API')
    .setDescription('API para explorar a linha do tempo do Universo Cinematográfico Marvel, com controle de spoilers, trilhas, personagens e acontecimentos.')
    .setVersion('1.0')
    .addTag('status', 'Rotas de saúde e verificação ds API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Aplicação rodando em: http://localhost:3000`);
  console.log(`📚 Documentação Swagger disponível em: http://localhost:3000/api`);
}
void bootstrap();

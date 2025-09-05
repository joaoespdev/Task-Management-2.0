import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS permite chamadas do Frontend
  app.enableCors();

  // Prefixo global para todas as rotas (ex: /api/users)
  app.setGlobalPrefix('api');

  // Validação global dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('API para gerenciamento de tarefas')
    .setVersion('1.0')
    .addBearerAuth() // para JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`API rodando na porta ${process.env.PORT ?? 3000}`);
}
bootstrap();

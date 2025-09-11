import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware de logging PRIMEIRO
  app.use((req, res, next) => {
    console.log('Request Headers:', req.headers);
    console.log('Authorization:', req.headers.authorization);
    next();
  });

  // Depois as outras configurações
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('API para gerenciamento de tarefas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`API rodando na porta ${process.env.PORT ?? 3000}`);
}
bootstrap();

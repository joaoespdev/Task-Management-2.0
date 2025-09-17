import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as knex from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Forçar uso do ambiente de teste
process.env.NODE_ENV = 'test';

// Carregar configurações de teste
dotenv.config({ path: '.env.test' });

// Variáveis globais para os testes
let app: INestApplication;
let db: any;

/**
 * Configura o ambiente de teste, incluindo aplicação e banco
 */
export async function setupTestApp() {
  // Verificar se o banco de teste está acessível
  try {
    db = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
    });

    await db.raw('SELECT 1');
    console.log('✓ Conexão com banco de teste estabelecida');
  } catch (error) {
    console.error('✗ Falha ao conectar ao banco de teste:', error.message);
    console.error(
      `Verifique se o container test-db está rodando e acessível em ${process.env.DB_HOST}:${process.env.DB_PORT}`,
    );
    throw error;
  }

  // Executar migrations no banco de teste
  try {
    const knexConfig = require('../knexfile').default.test;
    const knexInstance = knex(knexConfig);
    await knexInstance.migrate.latest();
    console.log('✓ Migrations aplicadas com sucesso no banco de teste');
    await knexInstance.destroy();
  } catch (error) {
    console.error('✗ Falha ao executar migrations:', error.message);
    throw error;
  }

  // Configurar a aplicação NestJS para usar o banco de teste
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return { app, db };
}

/**
 * Limpar dados de teste entre testes
 */
export async function cleanDb(knexInstance: any) {
  // Limpar dados sem afetar a estrutura do banco
  await knexInstance.raw('TRUNCATE TABLE tasks CASCADE');
  await knexInstance.raw('TRUNCATE TABLE users CASCADE');
}

/**
 * Fechamento do ambiente de teste
 */
export async function teardownTestApp(app: INestApplication, db: any) {
  await cleanDb(db);
  await db.destroy();
  await app.close();
}

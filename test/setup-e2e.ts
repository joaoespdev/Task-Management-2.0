import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import knex, { Knex } from 'knex'; // Importação ajustada
import * as dotenv from 'dotenv';

// Forçar uso do ambiente de teste
process.env.NODE_ENV = 'test';

// Carregar configurações de teste
dotenv.config({ path: '.env.test' });

// Variáveis globais para os testes
let app: INestApplication;
let db: Knex; // Tipagem correta

/**
 * Configura o ambiente de teste, incluindo aplicação e banco
 */
export async function setupTestApp() {
  // Se a aplicação já existe, não faz nada. Isso pode ser útil no futuro, mas não é a causa do problema atual.
  if (app) {
    return { app, db };
  }

  // Obter a configuração do knexfile
  const knexConfig = require('../knexfile').default.test;

  // Criar UMA ÚNICA instância do Knex
  db = knex(knexConfig);

  // Verificar se o banco de teste está acessível
  try {
    await db.raw('SELECT 1');
    console.log('✓ Conexão com banco de teste estabelecida');
  } catch (error) {
    console.error('✗ Falha ao conectar ao banco de teste:', error.message);
    console.error(
      `Verifique se o container test-db está rodando e acessível em ${process.env.DB_HOST}:${process.env.DB_PORT}`,
    );
    await db.destroy(); // Garante que a conexão seja fechada em caso de erro
    throw error;
  }

  // Executar migrations no banco de teste USANDO A MESMA CONEXÃO
  try {
    await db.migrate.latest();
    console.log('✓ Migrations aplicadas com sucesso no banco de teste');
  } catch (error) {
    console.error('✗ Falha ao executar migrations:', error.message);
    await db.destroy(); // Garante que a conexão seja fechada em caso de erro
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
export async function cleanDb(knexInstance: Knex) {
  // Limpar dados sem afetar a estrutura do banco
  await knexInstance.raw('TRUNCATE TABLE tasks CASCADE');
  await knexInstance.raw('TRUNCATE TABLE users CASCADE');
}

/**
 * Fechamento do ambiente de teste
 */
export async function teardownTestApp(
  appInstance: INestApplication,
  dbInstance: Knex,
) {
  if (appInstance) {
    await appInstance.close();
  }
  if (dbInstance) {
    await dbInstance.destroy();
  }
}

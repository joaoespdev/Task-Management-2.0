import { Module } from '@nestjs/common';
import knex from 'knex';
import * as dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

@Module({
  providers: [
    {
      provide: 'KNEX_CONNECTION', // nome do provedor para injeção
      useFactory: () => {
        // Aqui você cria a instância do Knex (conexão com PostgreSQL)
        const db = knex({
          client: 'pg',
          connection: {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres123',
            database: process.env.DB_NAME || 'task_management',
          },
        });
        return db;
      },
    },
  ],
  exports: ['KNEX_CONNECTION'], // permite injetar em outros módulos
})
export class DatabaseModule {}

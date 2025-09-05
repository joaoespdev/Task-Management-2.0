import { Module } from '@nestjs/common';
import knex from 'knex';

@Module({
  providers: [
    {
      provide: 'KNEX_CONNECTION', // nome do provedor para injeção
      useFactory: () => {
        // Aqui você cria a instância do Knex (conexão com PostgreSQL)
        const db = knex({
          client: 'pg',
          connection: {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          },
        });
        return db;
      },
    },
  ],
  exports: ['KNEX_CONNECTION'], // permite injetar em outros módulos
})
export class DatabaseModule {}

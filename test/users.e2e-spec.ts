import * as supertest from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Knex } from 'knex';
import { setupTestApp, cleanDb, teardownTestApp } from './setup-e2e';
import {
  createTestUser,
  createMultipleTestUsers,
  clearUsers,
} from '../test/seeds/users.seed';

describe('Users Module (e2e)', () => {
  let app: INestApplication;
  let db: Knex;
  let authToken: string;
  let userId: number;

  // Configurar o ambiente de teste antes de todos os testes
  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;

    // Limpar dados do banco
    await cleanDb(db);
  });

  // Limpar e fechar recursos após todos os testes
  afterAll(async () => {
    await teardownTestApp(app, db);
  });

  describe('Registro e autenticação', () => {
    it('POST /api/users/register - deve registrar um novo usuário', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const response = await supertest(app.getHttpServer())
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Verificar resposta
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', userData.name);
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).not.toHaveProperty('password');

      // Guardar ID para testes subsequentes
      userId = response.body.id;
    });

    it('POST /api/users/register - deve rejeitar email duplicado', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'new@example.com', // Email já usado no teste anterior
        password: 'password123',
      };

      const response = await supertest(app.getHttpServer())
        .post('/api/users/register')
        .send(userData)
        .expect(409); // Conflict

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email já cadastrado');
    });

    it('POST /api/auth/login - deve fazer login e retornar token', async () => {
      const loginData = {
        email: 'new@example.com',
        password: 'password123',
      };

      const response = await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(201);

      // Verificar resposta
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', userId);

      // Guardar token para testes subsequentes
      authToken = response.body.access_token;
    });
  });

  describe('Operações protegidas', () => {
    // Criar mais usuários para testes
    beforeAll(async () => {
      await createMultipleTestUsers(db, 3);
    });

    it('GET /api/users - deve negar acesso sem autenticação', async () => {
      await supertest(app.getHttpServer()).get('/api/users').expect(401); // Unauthorized
    });

    it('GET /api/users - deve listar usuários com autenticação', async () => {
      const response = await supertest(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar resposta
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(4); // 1 do primeiro teste + 3 do createMultipleTestUsers

      // Verificar estrutura do primeiro usuário
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
    });

    it('GET /api/users/:id - deve buscar um usuário por ID', async () => {
      const response = await supertest(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar resposta
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', 'New User');
      expect(response.body).toHaveProperty('email', 'new@example.com');
    });

    it('GET /api/users/:id - deve retornar 404 para ID inexistente', async () => {
      await supertest(app.getHttpServer())
        .get('/api/users/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('PUT /api/users/:id - deve atualizar usuário', async () => {
      const updateData = {
        name: 'Updated User Name',
      };

      const response = await supertest(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verificar resposta
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('email', 'new@example.com');
    });

    it('PUT /api/users/:id - deve atualizar senha', async () => {
      const updateData = {
        password: 'newpassword123',
      };

      await supertest(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verificar se a senha foi atualizada testando o login
      const loginResponse = await supertest(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'new@example.com',
          password: 'newpassword123',
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('GET /api/users/simple-test - deve retornar mensagem simples', async () => {
      const response = await supertest(app.getHttpServer())
        .get('/api/users/simple-test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Esta rota funciona sem banco de dados!',
      });
    });

    it('DELETE /api/users/:id - deve remover usuário', async () => {
      const response = await supertest(app.getHttpServer())
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removido com sucesso');

      // Verificar que o usuário foi realmente removido
      await supertest(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

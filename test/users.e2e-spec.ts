import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Knex } from 'knex';
import { setupTestApp, cleanDb, teardownTestApp } from '../test/setup-e2e';
import {
  createTestUser,
  createMultipleTestUsers,
} from '../test/seeds/users.seed';

describe('Users Module (e2e)', () => {
  let app: INestApplication;
  let db: Knex;
  let authToken: string;
  let userId: number;
  let testUserEmail = 'new@example.com';
  let testUserPassword = 'password123';
  let adminUserId: number;
  let adminAuthToken: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;
  });

  // Limpa o banco antes de cada teste e cria os usuários base
  beforeEach(async () => {
    await cleanDb(db);

    const adminUser = await createTestUser(db, {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
    });
    adminUserId = adminUser.id;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminAuthToken = adminLoginResponse.body.access_token;

    const testUser = await createTestUser(db, {
      name: 'New User',
      email: testUserEmail,
      password: testUserPassword,
    });
    userId = testUser.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: testUserPassword });
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await teardownTestApp(app, db);
  });

  describe('Registro e autenticação', () => {
    it('POST /api/users/register - deve registrar um novo usuário', async () => {
      const userData = {
        name: 'Additional User',
        email: 'additional@example.com',
        password: testUserPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(userData.name);
    });

    it('POST /api/users/register - deve rejeitar email duplicado', async () => {
      const userData = {
        name: 'Duplicate User',
        email: testUserEmail,
        password: testUserPassword,
      };

      await request(app.getHttpServer())
        .post('/api/users/register')
        .send(userData)
        .expect(409);
    });

    it('POST /api/auth/login - deve fazer login e retornar token', async () => {
      const loginData = {
        email: testUserEmail,
        password: testUserPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('id', userId);
    });
  });

  describe('Operações protegidas', () => {
    it('GET /api/users - deve listar usuários', async () => {
      await createMultipleTestUsers(db, 2);
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      // 1 admin + 1 user principal + 2 extras = 4
      expect(response.body.length).toBe(4);
    });

    it('GET /api/users/:id - deve buscar um usuário por ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', 'New User');
    });

    it('GET /api/users/:id - deve retornar 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/api/users/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Atualização e remoção de usuário', () => {
    it('PUT /api/users/:id - deve atualizar usuário', async () => {
      const updateData = { name: 'Updated User Name' };

      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
    });

    it('DELETE /api/users/:id - deve remover usuário', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

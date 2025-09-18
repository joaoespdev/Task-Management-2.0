import { INestApplication } from '@nestjs/common';
import { Knex } from 'knex';
import request from 'supertest';
import { setupTestApp, cleanDb, teardownTestApp } from '../test/setup-e2e';
import { createTestUser } from '../test/seeds/users.seed';
import {
  createTestTask,
  createMultipleTestTasks,
  clearTasks,
} from './seeds/tasks.seed';

describe('Tasks Module (e2e)', () => {
  let app: INestApplication;
  let db: Knex;
  let authToken: string;
  let userId: number;
  let taskId: number;
  const testUserEmail = 'tasktest@example.com';
  const testUserPassword = 'password123';

  // Configurar o ambiente de teste antes de todos os testes
  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    db = setup.db;

    // Limpar dados do banco
    await cleanDb(db);

    // Criar um usuário para testes
    const user = await createTestUser(db, {
      name: 'Task Test User',
      email: testUserEmail,
      password: testUserPassword,
    });

    userId = user.id;

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      })
      .expect(201);

    authToken = loginResponse.body.access_token;
  });

  // Limpar e fechar recursos após todos os testes
  afterAll(async () => {
    await teardownTestApp(app, db);
  });

  describe('Criação de Tarefas', () => {
    it('POST /api/tasks - deve criar uma nova tarefa', async () => {
      const taskData = {
        title: 'Tarefa E2E',
        description: 'Descrição da tarefa E2E',
        assignee_id: userId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias a partir de agora
        status: 'pending',
      };

      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      // Verificar resposta
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', taskData.title);
      expect(response.body).toHaveProperty('assignee_id', userId);

      // Guardar ID para testes subsequentes
      taskId = response.body.id;
    });

    it('POST /api/tasks - deve rejeitar tarefas sem autenticação', async () => {
      const taskData = {
        title: 'Tarefa Sem Auth',
        description: 'Esta tarefa não deve ser criada',
        due_date: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/tasks')
        .send(taskData)
        .expect(401); // Unauthorized
    });

    it('POST /api/tasks - deve rejeitar dados inválidos', async () => {
      const invalidTaskData = {
        // Sem título (obrigatório)
        description: 'Descrição da tarefa inválida',
        due_date: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTaskData)
        .expect(400); // Bad Request
    });
  });

  describe('Consulta de Tarefas', () => {
    // Criar múltiplas tarefas para testes de listagem
    beforeAll(async () => {
      // Garantir que temos tarefas para testar
      const tasks = await createMultipleTestTasks(db, userId);

      // Definir uma task urgente se não tiver sido criada antes
      const urgentTaskExists = await db('tasks')
        .where('title', 'Tarefa Urgente')
        .first();
      if (!urgentTaskExists) {
        await createTestTask(db, {
          title: 'Tarefa Urgente',
          description: 'Esta task vence em breve',
          status: 'pending',
          assignee_id: userId,
          due_date: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 horas a partir de agora
        });
      }

      // Se não tivermos um taskId válido, usar o primeiro da lista
      if (!taskId && tasks.length > 0) {
        taskId = tasks[0].id;
      }
    });

    it('GET /api/tasks - deve listar tarefas com paginação', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar estrutura da resposta
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta.total).toBeGreaterThan(0);
    });

    it('GET /api/tasks?status=pending - deve filtrar por status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar que todas tarefas retornadas têm status pending
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((task) => {
        expect(task.status).toBe('pending');
      });
    });

    it('GET /api/tasks/:id - deve buscar uma tarefa específica', async () => {
      // Garantir que temos um ID válido para testar
      if (!taskId) {
        const task = await createTestTask(db, {
          title: 'Tarefa para buscar',
          description: 'Descrição da tarefa para buscar',
          assignee_id: userId,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });
        taskId = task.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar dados da tarefa retornada
      expect(response.body).toHaveProperty('id', taskId);
    });

    it('GET /api/tasks/:id - deve retornar 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/api/tasks/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('GET /api/tasks/due-soon - deve retornar tarefas com prazo próximo', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks/due-soon')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar resposta (deve haver pelo menos a tarefa urgente do seed)
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Encontrar tarefa com título 'Tarefa Urgente'
      const urgentTask = response.body.find(
        (t) => t.title === 'Tarefa Urgente',
      );
      expect(urgentTask).toBeDefined();
    });
  });

  describe('Estatísticas de Tarefas', () => {
    it('GET /api/tasks/stats/status - deve retornar estatísticas por status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks/stats/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar estrutura da resposta
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('in_progress');
      expect(response.body).toHaveProperty('percent_completed');

      // Verificar consistência dos dados
      expect(response.body.total).toBe(
        response.body.completed +
          response.body.pending +
          response.body.in_progress,
      );
    });

    it('GET /api/tasks/stats/user - deve retornar estatísticas por usuário', async () => {
      // Garantir que temos tarefas associadas ao usuário
      await createTestTask(db, {
        title: 'Tarefa para estatística',
        description: 'Descrição da tarefa para estatística',
        assignee_id: userId,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app.getHttpServer())
        .get('/api/tasks/stats/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar estrutura da resposta
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Deve encontrar o usuário de teste
      const userStats = response.body.find((u) => u.user_id === userId);
      expect(userStats).toBeDefined();
      expect(userStats).toHaveProperty('count');
      expect(userStats.count).toBeGreaterThan(0);
    });
  });

  describe('Atualização e Remoção de Tarefas', () => {
    // Garantir que temos uma tarefa para atualizar/remover
    beforeAll(async () => {
      if (!taskId) {
        const task = await createTestTask(db, {
          title: 'Tarefa para atualizar',
          description: 'Descrição da tarefa para atualizar',
          assignee_id: userId,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        });
        taskId = task.id;
      }
    });

    it('PUT /api/tasks/:id - deve atualizar uma tarefa', async () => {
      const updateData = {
        title: 'Tarefa E2E Atualizada',
        status: 'in_progress',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verificar dados atualizados
      expect(response.body).toHaveProperty('id', taskId);
      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('status', updateData.status);
    });

    it('PUT /api/tasks/:id - deve rejeitar dados inválidos', async () => {
      const invalidUpdateData = {
        status: 'status_invalido',
      };

      await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400); // Bad Request
    });

    it('DELETE /api/tasks/:id - deve remover uma tarefa', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar mensagem de confirmação
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removed successfully');

      // Verificar que a tarefa foi realmente removida
      await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Limpar o taskId já que a tarefa foi removida
      taskId = null;
    });
  });
});

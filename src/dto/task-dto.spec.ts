import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';

describe('Task DTOs', () => {
  describe('CreateTaskDto', () => {
    it('deve validar um DTO com dados completos', async () => {
      const dto = plainToClass(CreateTaskDto, {
        title: 'Tarefa de Teste',
        description: 'Descrição da tarefa de teste',
        assignee_id: 1,
        due_date: '2025-12-31T23:59:59.999Z',
        status: 'pending',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar um DTO com campos obrigatórios apenas', async () => {
      const dto = plainToClass(CreateTaskDto, {
        title: 'Tarefa de Teste',
        description: 'Descrição da tarefa de teste',
        due_date: '2025-12-31T23:59:59.999Z',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar um DTO sem título', async () => {
      const dto = plainToClass(CreateTaskDto, {
        description: 'Descrição da tarefa de teste',
        due_date: '2025-12-31T23:59:59.999Z',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('title');
    });

    it('deve rejeitar um DTO sem descrição', async () => {
      const dto = plainToClass(CreateTaskDto, {
        title: 'Tarefa de Teste',
        due_date: '2025-12-31T23:59:59.999Z',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('description');
    });

    it('deve rejeitar a criação de tarefas com status inválido', async () => {
      const dto = plainToClass(CreateTaskDto, {
        title: 'Tarefa de Teste',
        description: 'Descrição da tarefa de teste',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('due_date');
    });

    it('deve rejeitar um DTO com status inválido', async () => {
      const dto = plainToClass(CreateTaskDto, {
        title: 'Tarefa de Teste',
        description: 'Descrição da tarefa de teste',
        due_date: '2025-12-31T23:59:59.999Z',
        status: 'invalid_status',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('deve rejeitar um DTO com assignee_id inválido', async () => {
      const dto = plainToClass(CreateTaskDto, {
        title: 'Tarefa de Teste',
        description: 'Descrição da tarefa de teste',
        due_date: '2025-12-31T23:59:59.999Z',
        assignee_id: 'abc',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('assignee_id');
    });
  });

  describe('UpdateTaskDto', () => {
    it('deve validar um DTO com todos os campos', async () => {
      const dto = plainToClass(UpdateTaskDto, {
        title: 'Tarefa Atualizada',
        description: 'Descrição atualizada',
        assignee_id: 2,
        due_date: '2026-01-15T12:00:00.000Z',
        status: 'in_progress',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar um DTO parcial com apenas título', async () => {
      const dto = plainToClass(UpdateTaskDto, {
        title: 'Título Atualizado',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar um DTO parcial com apenas status', async () => {
      const dto = plainToClass(UpdateTaskDto, {
        status: 'completed',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar a atualização de tarefa com status inválido', async () => {
      const dto = plainToClass(UpdateTaskDto, {
        status: 'invalid_status',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('TaskQueryDto', () => {
    it('deve validar um DTO de consulta completo', async () => {
      const dto = plainToClass(TaskQueryDto, {
        status: 'pending',
        assignee_id: 1,
        due_from: '2025-01-01T00:00:00.000Z',
        due_to: '2025-12-31T23:59:59.999Z',
        page: 2,
        limit: 15,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar um DTO de consulta vazio', async () => {
      const dto = plainToClass(TaskQueryDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar um DTO com valor de página negativo', async () => {
      const dto = plainToClass(TaskQueryDto, {
        page: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('deve rejeitar a consulta de tarefas com filtro de status inválido', async () => {
      const dto = plainToClass(TaskQueryDto, {
        status: 'invalid_status',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });
  });
});

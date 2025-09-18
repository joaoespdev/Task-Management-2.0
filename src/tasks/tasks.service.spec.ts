import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from '../tasks/tasks.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  mockTaskComplete,
  mockTaskResponse,
  mockTasksList,
  mockTasksDueSoon,
  mockTaskStatsStatus,
  mockTaskStatsUser,
  mockCreateTaskDto,
  mockUpdateTaskDto,
  mockTaskQueryDto,
  createTasksKnexMock,
} from '../../test/mocks/tasks.mock';

describe('TasksService', () => {
  let service: TasksService;
  let mockKnex: any;

  beforeEach(async () => {
    mockKnex = createTasksKnexMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: () => mockKnex,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('deve criar uma tarefa com os dados corretos', async () => {
      mockKnex.first.mockResolvedValueOnce({ id: 1, name: 'Test User' });

      mockKnex.returning.mockResolvedValueOnce([mockTaskResponse]);

      const result = await service.createTask(mockCreateTaskDto);

      expect(mockKnex.where).toHaveBeenCalledWith({
        id: mockCreateTaskDto.assignee_id,
      });
      expect(mockKnex.insert).toHaveBeenCalledWith({
        title: mockCreateTaskDto.title,
        description: mockCreateTaskDto.description,
        assignee_id: mockCreateTaskDto.assignee_id,
        due_date: expect.any(Date),
        status: mockCreateTaskDto.status,
      });

      expect(result).toEqual(mockTaskResponse);
    });

    it('deve lançar BadRequestException se o assignee não existir', async () => {
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(service.createTask(mockCreateTaskDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockKnex.insert).not.toHaveBeenCalled();
    });

    it('deve criar tarefa com valores padrão quando opcionais não são fornecidos', async () => {
      const simpleDto = {
        title: 'Tarefa Simples',
        description: 'Descrição da tarefa simples',
        due_date: '2025-12-31T23:59:59.999Z',
      };

      mockKnex.returning.mockResolvedValueOnce([
        {
          ...mockTaskResponse,
          title: simpleDto.title,
          description: simpleDto.description,
          assignee_id: null,
        },
      ]);

      const result = await service.createTask(simpleDto as any);

      expect(mockKnex.insert).toHaveBeenCalledWith({
        title: simpleDto.title,
        description: simpleDto.description,
        assignee_id: null,
        due_date: expect.any(Date),
        status: 'pending',
      });

      expect(result).toHaveProperty('title', simpleDto.title);
      expect(result).toHaveProperty('assignee_id', null);
      expect(result).toHaveProperty('status', 'pending');
    });
  });

  describe('getTaskById', () => {
    it('deve encontrar uma tarefa por ID', async () => {
      mockKnex.first.mockResolvedValueOnce(mockTaskComplete);

      const result = await service.getTaskById(1);

      expect(mockKnex.where).toHaveBeenCalledWith({ id: 1 });

      expect(result).toEqual(mockTaskComplete);
    });

    it('deve lançar NotFoundException se a tarefa não existir', async () => {
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(service.getTaskById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('tasksDueIn24h', () => {
    it('deve retornar tarefas com prazo nas próximas 24h', async () => {
      mockKnex.orderBy.mockResolvedValueOnce(mockTasksDueSoon);

      const result = await service.tasksDueIn24h();

      expect(mockKnex.whereBetween).toHaveBeenCalledWith(
        'tasks.due_date',
        expect.any(Array),
      );
      expect(mockKnex.andWhereNot).toHaveBeenCalledWith(
        'tasks.status',
        'completed',
      );
      expect(mockKnex.orderBy).toHaveBeenCalledWith('tasks.due_date', 'asc');

      expect(result).toEqual(mockTasksDueSoon);
    });
  });

  describe('statsByStatus', () => {
    it('deve retornar estatísticas por status', async () => {
      mockKnex.groupBy.mockResolvedValueOnce([
        { status: 'pending', count: '5' },
        { status: 'in_progress', count: '2' },
        { status: 'completed', count: '3' },
      ]);

      const result = await service.statsByStatus();

      expect(mockKnex.select).toHaveBeenCalledWith('status');
      expect(mockKnex.count).toHaveBeenCalledWith('* as count');
      expect(mockKnex.groupBy).toHaveBeenCalledWith('status');

      expect(result).toHaveProperty('total', 10);
      expect(result).toHaveProperty('pending', 5);
      expect(result).toHaveProperty('in_progress', 2);
      expect(result).toHaveProperty('completed', 3);
      expect(result).toHaveProperty('percent_completed', 30);
    });
  });

  describe('statsByUser', () => {
    it('deve retornar estatísticas por usuário', async () => {
      mockKnex.groupBy.mockResolvedValueOnce([
        { user_id: 1, user_name: 'User 1', count: '5' },
        { user_id: 2, user_name: 'User 2', count: '3' },
        { user_id: null, user_name: null, count: '2' },
      ]);

      const result = await service.statsByUser();

      expect(mockKnex.select).toHaveBeenCalledWith(
        'u.id as user_id',
        'u.name as user_name',
      );
      expect(mockKnex.count).toHaveBeenCalledWith('t.id as count');
      expect(mockKnex.leftJoin).toHaveBeenCalledWith(
        'users as u',
        't.assignee_id',
        'u.id',
      );
      expect(mockKnex.groupBy).toHaveBeenCalledWith('u.id', 'u.name');

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('user_id', 1);
      expect(result[0]).toHaveProperty('count', 5);
    });
  });

  describe('updateTask', () => {
    it('deve atualizar uma tarefa existente', async () => {
      mockKnex.first.mockResolvedValueOnce(mockTaskComplete);

      mockKnex.returning.mockResolvedValueOnce([
        {
          ...mockTaskComplete,
          title: mockUpdateTaskDto.title,
          status: mockUpdateTaskDto.status,
        },
      ]);

      const result = await service.updateTask(1, mockUpdateTaskDto);

      expect(mockKnex.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockKnex.update).toHaveBeenCalledWith(mockUpdateTaskDto);

      expect(result).toHaveProperty('title', mockUpdateTaskDto.title);
      expect(result).toHaveProperty('status', mockUpdateTaskDto.status);
    });

    it('deve converter a data devido para Date ao atualizar', async () => {
      mockKnex.first.mockResolvedValueOnce(mockTaskComplete);

      mockKnex.returning.mockResolvedValueOnce([
        {
          ...mockTaskComplete,
          due_date: new Date('2026-01-01T12:00:00.000Z'),
        },
      ]);

      const updateDto = {
        due_date: '2026-01-01T12:00:00.000Z',
      };

      await service.updateTask(1, updateDto);

      expect(mockKnex.update).toHaveBeenCalledWith({
        due_date: expect.any(Date),
      });
    });

    it('deve lançar NotFoundException se a tarefa não existir', async () => {
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(service.updateTask(999, mockUpdateTaskDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockKnex.update).not.toHaveBeenCalled();
    });

    it('deve verificar se o assignee existe ao atualizar', async () => {
      mockKnex.first.mockResolvedValueOnce(mockTaskComplete);

      mockKnex.first.mockResolvedValueOnce(null);

      const updateDto = {
        assignee_id: 999,
      };

      await expect(service.updateTask(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockKnex.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('deve excluir uma tarefa existente', async () => {
      mockKnex.first.mockResolvedValueOnce(mockTaskComplete);

      const result = await service.deleteTask(1);

      expect(mockKnex.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockKnex.delete).toHaveBeenCalled();

      expect(result).toEqual({ message: 'Task removed successfully' });
    });

    it('deve lançar NotFoundException se a tarefa não existir', async () => {
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(service.deleteTask(999)).rejects.toThrow(NotFoundException);

      expect(mockKnex.delete).not.toHaveBeenCalled();
    });
  });
});

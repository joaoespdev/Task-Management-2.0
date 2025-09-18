import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from '../tasks/tasks.controller';
import { TasksService } from '../tasks/tasks.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  mockTaskResponse,
  mockTasksList,
  mockTasksDueSoon,
  mockTaskStatsStatus,
  mockTaskStatsUser,
  mockCreateTaskDto,
  mockUpdateTaskDto,
  mockTaskQueryDto,
} from '../../test/mocks/tasks.mock';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  beforeEach(async () => {
    const mockTasksService = {
      createTask: jest.fn(),
      getTaskById: jest.fn(),
      listTasks: jest.fn(),
      tasksDueIn24h: jest.fn(),
      statsByStatus: jest.fn(),
      statsByUser: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('deve criar uma nova tarefa', async () => {
      jest
        .spyOn(tasksService, 'createTask')
        .mockResolvedValue(mockTaskResponse);

      const result = await controller.create(mockCreateTaskDto);

      expect(tasksService.createTask).toHaveBeenCalledWith(mockCreateTaskDto);

      expect(result).toEqual(mockTaskResponse);
    });

    it('deve repassar exceções do service', async () => {
      jest
        .spyOn(tasksService, 'createTask')
        .mockRejectedValue(new BadRequestException('Assignee not found'));

      await expect(controller.create(mockCreateTaskDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('list', () => {
    it('deve listar tarefas com filtros', async () => {
      const paginatedResponse = {
        data: mockTasksList,
        meta: {
          total: 3,
          page: 1,
          limit: 10,
        },
      };

      jest
        .spyOn(tasksService, 'listTasks')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.list(mockTaskQueryDto);

      expect(tasksService.listTasks).toHaveBeenCalledWith(mockTaskQueryDto);

      expect(result).toEqual(paginatedResponse);
      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(3);
    });
  });

  describe('findById', () => {
    it('deve retornar uma tarefa pelo ID', async () => {
      jest
        .spyOn(tasksService, 'getTaskById')
        .mockResolvedValue(mockTaskResponse);

      const result = await controller.findById(1);

      expect(tasksService.getTaskById).toHaveBeenCalledWith(1);

      expect(result).toEqual(mockTaskResponse);
    });

    it('deve repassar exceções do service', async () => {
      jest
        .spyOn(tasksService, 'getTaskById')
        .mockRejectedValue(new NotFoundException('Task not found'));

      await expect(controller.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('dueSoon', () => {
    it('deve retornar tarefas com prazo próximo', async () => {
      jest
        .spyOn(tasksService, 'tasksDueIn24h')
        .mockResolvedValue(mockTasksDueSoon);

      const result = await controller.dueSoon();

      expect(tasksService.tasksDueIn24h).toHaveBeenCalled();

      expect(result).toEqual(mockTasksDueSoon);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task Urgente');
    });
  });

  describe('statsStatus', () => {
    it('deve retornar estatísticas por status', async () => {
      jest
        .spyOn(tasksService, 'statsByStatus')
        .mockResolvedValue(mockTaskStatsStatus);

      const result = await controller.statsStatus();

      expect(tasksService.statsByStatus).toHaveBeenCalled();

      expect(result).toEqual(mockTaskStatsStatus);
      expect(result.total).toBe(10);
      expect(result.percent_completed).toBe(30);
    });
  });

  describe('statsUser', () => {
    it('deve retornar estatísticas por usuário', async () => {
      jest
        .spyOn(tasksService, 'statsByUser')
        .mockResolvedValue(mockTaskStatsUser);

      const result = await controller.statsUser();

      expect(tasksService.statsByUser).toHaveBeenCalled();

      expect(result).toEqual(mockTaskStatsUser);
      expect(result).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('deve atualizar uma tarefa', async () => {
      const updatedTask = {
        ...mockTaskResponse,
        title: mockUpdateTaskDto.title,
        status: mockUpdateTaskDto.status,
      };
      jest.spyOn(tasksService, 'updateTask').mockResolvedValue(updatedTask);

      const result = await controller.update(1, mockUpdateTaskDto);

      expect(tasksService.updateTask).toHaveBeenCalledWith(
        1,
        mockUpdateTaskDto,
      );

      expect(result).toEqual(updatedTask);
      expect(result.title).toBe(mockUpdateTaskDto.title);
      expect(result.status).toBe(mockUpdateTaskDto.status);
    });
  });

  describe('remove', () => {
    it('deve remover uma tarefa', async () => {
      const mockResponse = { message: 'Task removed successfully' };
      jest.spyOn(tasksService, 'deleteTask').mockResolvedValue(mockResponse);

      const result = await controller.remove(1);

      expect(tasksService.deleteTask).toHaveBeenCalledWith(1);

      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('removed successfully');
    });
  });
});

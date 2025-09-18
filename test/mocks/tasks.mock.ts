import { Task } from '../../src/interfaces/task.interface';
import { CreateTaskDto } from '../../src/dto/create-task.dto';
import { UpdateTaskDto } from '../../src/dto/update-task.dto';
import { TaskQueryDto } from '../../src/dto/task-query.dto';

export const mockTaskComplete: Task = {
  id: 1,
  title: 'Task de Teste',
  description: 'Descrição da tarefa de teste',
  status: 'pending',
  assignee_id: 1,
  due_date: new Date('2025-12-31T23:59:59.999Z'),
  created_at: new Date('2025-09-01T00:00:00.000Z'),
  updated_at: new Date('2025-09-01T00:00:00.000Z'),
};

export const mockTaskResponse = {
  id: 1,
  title: 'Task de Teste',
  description: 'Descrição da tarefa de teste',
  status: 'pending',
  assignee_id: 1,
  due_date: new Date('2025-12-31T23:59:59.999Z'),
};

export const mockTasksList = [
  {
    id: 1,
    title: 'Task 1',
    description: 'Descrição da task 1',
    status: 'pending',
    assignee_id: 1,
    due_date: new Date('2025-10-10T10:00:00.000Z'),
  },
  {
    id: 2,
    title: 'Task 2',
    description: 'Descrição da task 2',
    status: 'in_progress',
    assignee_id: 2,
    due_date: new Date('2025-11-11T11:00:00.000Z'),
  },
  {
    id: 3,
    title: 'Task 3',
    description: 'Descrição da task 3',
    status: 'completed',
    assignee_id: 1,
    due_date: new Date('2025-12-12T12:00:00.000Z'),
  },
];

export const mockTasksDueSoon = [
  {
    id: 4,
    title: 'Task Urgente',
    description: 'Esta task vence em breve',
    status: 'pending',
    assignee_id: 1,
    due_date: new Date(Date.now() + 12 * 60 * 60 * 1000),
    assignee_name: 'Test User',
  },
];

export const mockTaskStatsStatus = {
  total: 10,
  completed: 3,
  pending: 5,
  in_progress: 2,
  percent_completed: 30,
};

export const mockTaskStatsUser = [
  { user_id: 1, user_name: 'User 1', count: 5 },
  { user_id: 2, user_name: 'User 2', count: 3 },
  { user_id: null, user_name: null, count: 2 },
];

export const mockCreateTaskDto: CreateTaskDto = {
  title: 'Nova Task',
  description: 'Descrição da nova task',
  assignee_id: 1,
  due_date: '2025-12-31T23:59:59.999Z',
  status: 'pending',
};

export const mockUpdateTaskDto: UpdateTaskDto = {
  title: 'Task Atualizada',
  status: 'in_progress',
};

export const mockTaskQueryDto: TaskQueryDto = {
  status: 'pending',
  assignee_id: 1,
  page: 1,
  limit: 10,
};

export const createTasksKnexMock = () => {
  return {
    where: jest.fn().mockReturnThis(),
    whereNot: jest.fn().mockReturnThis(),
    andWhereNot: jest.fn().mockReturnThis(),
    whereBetween: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockResolvedValue(1),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    modify: jest.fn().mockImplementation((cb) => {
      cb && cb(createTasksKnexMock());
      return createTasksKnexMock();
    }),
  };
};

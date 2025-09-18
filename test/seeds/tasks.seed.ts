import { Knex } from 'knex';
import { createTestUser } from './users.seed';

export interface SeedTask {
  id?: number;
  title: string;
  description: string;
  status?: 'pending' | 'in_progress' | 'completed';
  assignee_id?: number;
  due_date: Date;
}

export async function createTestTask(
  knex: Knex,
  taskData: SeedTask = {
    title: 'Tarefa de Teste',
    description: 'Descrição da tarefa de teste',
    status: 'pending',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
): Promise<any> {
  const [task] = await knex('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending',
      assignee_id: taskData.assignee_id || null,
      due_date: taskData.due_date,
    })
    .returning('*');

  return task;
}

export async function createMultipleTestTasks(
  knex: Knex,
  userId?: number,
): Promise<any[]> {
  if (!userId) {
    const user = await createTestUser(knex);
    userId = user.id;
  }

  const now = new Date();

  const tasksData = [
    {
      title: 'Tarefa Pendente',
      description: 'Tarefa com status pendente',
      status: 'pending',
      assignee_id: userId,
      due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Tarefa Em Andamento',
      description: 'Tarefa com status em andamento',
      status: 'in_progress',
      assignee_id: userId,
      due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Tarefa Concluída',
      description: 'Tarefa com status concluído',
      status: 'completed',
      assignee_id: userId,
      due_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Tarefa Urgente',
      description: 'Tarefa com prazo próximo',
      status: 'pending',
      assignee_id: userId,
      due_date: new Date(now.getTime() + 12 * 60 * 60 * 1000),
    },
    {
      title: 'Tarefa Sem Responsável',
      description: 'Tarefa sem responsável atribuído',
      status: 'pending',
      assignee_id: null,
      due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const tasks = [];
  for (const taskData of tasksData) {
    const task = await createTestTask(knex, taskData as SeedTask);
    tasks.push(task);
  }

  return tasks;
}

export async function clearTasks(knex: Knex): Promise<void> {
  await knex('tasks').delete();
}

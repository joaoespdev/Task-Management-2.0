import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';

@Injectable()
export class TasksService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async createTask(createDto: CreateTaskDto) {
    if (createDto.assignee_id) {
      const assignee = await this.knex('users')
        .where({ id: createDto.assignee_id })
        .first();
      if (!assignee) throw new BadRequestException('Assignee not found');
    }

    const [task] = await this.knex('tasks')
      .insert({
        title: createDto.title,
        description: createDto.description,
        assignee_id: createDto.assignee_id || null,
        due_date: new Date(createDto.due_date),
        status: createDto.status || 'pending',
      })
      .returning([
        'id',
        'title',
        'description',
        'assignee_id',
        'due_date',
        'status',
        'created_at',
        'updated_at',
      ]);

    return task;
  }

  async getTaskById(id: number) {
    const task = await this.knex('tasks').where({ id }).first();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async listTasks(query: TaskQueryDto) {
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    const qb = this.knex('tasks')
      .select('tasks.*', 'u.name as assignee_name')
      .leftJoin('users as u', 'tasks.assignee_id', 'u.id');

    if (query.status) qb.where('tasks.status', query.status);
    if (query.assignee_id) qb.where('tasks.assignee_id', query.assignee_id);
    if (query.due_from)
      qb.where('tasks.due_date', '>=', new Date(query.due_from));
    if (query.due_to) qb.where('tasks.due_date', '<=', new Date(query.due_to));

    const [countResult] = await this.knex('tasks')
      .count('* as total')
      .modify((qb2) => {
        if (query.status) qb2.where('status', query.status);
        if (query.assignee_id) qb2.where('assignee_id', query.assignee_id);
        if (query.due_from)
          qb2.where('due_date', '>=', new Date(query.due_from));
        if (query.due_to) qb2.where('due_date', '<=', new Date(query.due_to));
      });

    const rows = await qb
      .orderBy('tasks.due_date', 'asc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      meta: {
        total: Number(countResult.total),
        page,
        limit,
      },
    };
  }

  async tasksDueIn24h() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const rows = await this.knex('tasks')
      .select('tasks.*', 'u.name as assignee_name')
      .leftJoin('users as u', 'tasks.assignee_id', 'u.id')
      .whereBetween('tasks.due_date', [now, in24h])
      .andWhereNot('tasks.status', 'completed')
      .orderBy('tasks.due_date', 'asc');

    return rows;
  }

  async statsByStatus() {
    const rows = await this.knex('tasks')
      .select('status')
      .count('* as count')
      .groupBy('status');

    return rows.reduce(
      (acc, r: any) => {
        acc[r.status] = Number(r.count);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async statsByUser() {
    const rows = await this.knex('tasks as t')
      .select('u.id as user_id', 'u.name as user_name')
      .count('t.id as count')
      .leftJoin('users as u', 't.assignee_id', 'u.id')
      .groupBy('u.id', 'u.name');

    return rows.map((r: any) => ({
      user_id: r.user_id,
      user_name: r.user_name,
      count: Number(r.count),
    }));
  }

  async updateTask(id: number, updateDto: UpdateTaskDto) {
    const task = await this.knex('tasks').where({ id }).first();
    if (!task) throw new NotFoundException('Task not found');

    if (updateDto.assignee_id) {
      const assignee = await this.knex('users')
        .where({ id: updateDto.assignee_id })
        .first();
      if (!assignee) throw new BadRequestException('Assignee not found');
    }

    const updateData: any = { ...updateDto };
    if (updateDto.due_date) updateData.due_date = new Date(updateDto.due_date);

    const [updated] = await this.knex('tasks')
      .where({ id })
      .update(updateData)
      .returning([
        'id',
        'title',
        'description',
        'assignee_id',
        'due_date',
        'status',
        'created_at',
        'updated_at',
      ]);

    return updated;
  }

  async deleteTask(id: number) {
    const task = await this.knex('tasks').where({ id }).first();
    if (!task) throw new NotFoundException('Task not found');

    await this.knex('tasks').where({ id }).delete();
    return { message: 'Task removed successfully' };
  }
}

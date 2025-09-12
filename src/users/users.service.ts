import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async createUser(name: string, email: string, password: string) {
    const exists = await this.knex('users').where({ email }).first();
    if (exists) throw new ConflictException('Email já cadastrado');

    const hash = await bcrypt.hash(password, 10);
    const [user] = await this.knex('users')
      .insert({ name, email, password: hash })
      .returning(['id', 'name', 'email']);
    return user;
  }

  async findById(id: number) {
    const user = await this.knex('users').where({ id }).first();
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return { id: user.id, name: user.name, email: user.email };
  }

  async listUsers() {
    return this.knex('users').select('id', 'name', 'email');
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.knex('users').where({ id }).first();
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updateData: any = { ...updateUserDto };

    // se senha for informada, criptografa antes de salvar
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const [updatedUser] = await this.knex('users')
      .where({ id })
      .update(updateData)
      .returning(['id', 'name', 'email']);

    return updatedUser;
  }

  async deleteUser(id: number) {
    const user = await this.knex('users').where({ id }).first();
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.knex('users').where({ id }).delete();
    return { message: 'Usuário removido com sucesso' };
  }
}

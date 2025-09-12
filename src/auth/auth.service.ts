import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Knex } from 'knex';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.knex('users').where({ email }).first();
    if (!user) throw new NotFoundException('Email não encontrado no sistema.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw new UnauthorizedException(
        'Senha inválida, tente novamente por favor.',
      );
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}

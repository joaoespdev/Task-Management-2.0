import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { email } from 'zod';

@Injectable()
export class UsersService {
    constructor(
        @Inject('KNEX_CONNECTION') private readonly knex: Knex,
        private readonly jwtService: JwtService,
    ) {}

    async createUser(name: string, email: string, password: string) {
        const exists = await this.knex('users').where({ email }).first();
        if (exists) throw new ConflictException('Email já cadastrado');
        const hash = await bcrypt.hash(password, 10);
        const [user] = await this.knex('users')
            .insert({ name, email, password: hash })
            .returning(['id', 'name', 'email']);
        return user;
    }

    async validateUser(email: string, password: string) {
        const user = await this.knex('users').where({{ email }}).first();
        if (!user) throw new NotFoundException('Email não encontrado no sistema.');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Senha inválida, tente novamente por favor.');
        return user;
    }

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        const payload = { sub: user.id, email: user.email };
        const token = await this.jwtService.signAsync(payload);
        return { acess_token: token, user: { id: user.id, name: user.name, email: user.email } };
    }

    async findById(id: number) {
        const user = await this.knex('users').where({ id }).first();
        if (!user) throw new NotFoundException('Usuário não encontrado');
        return { id: user.id, name: user.name, email: user.email };
    }

    async listUsers() {
        return this.knex('users').select('id', 'name', 'email');
    }
}

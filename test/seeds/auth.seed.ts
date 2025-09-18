import * as bcrypt from 'bcrypt';
import { Knex } from 'knex';
import { JwtService } from '@nestjs/jwt';

/**
 * Cria um usuário com credenciais para testes de autenticação
 *
 * @param knex Instância do Knex
 * @param email Email do usuário (deve ser único)
 * @param password Senha em texto plano (será hasheada)
 * @returns O usuário criado com ID
 */
export async function createAuthTestUser(
  knex: Knex,
  email: string = 'authtest@example.com',
  password: string = 'password123',
): Promise<{ id: number; email: string }> {
  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Verificar se o usuário já existe
  const existing = await knex('users').where({ email }).first();
  if (existing) {
    return { id: existing.id, email };
  }

  // Inserir usuário no banco
  const [user] = await knex('users')
    .insert({
      name: 'Auth Test User',
      email,
      password: hashedPassword,
    })
    .returning(['id', 'email']);

  return user;
}

/**
 * Gera um token JWT válido para testes
 *
 * @param jwtService Instância do JwtService
 * @param userId ID do usuário
 * @param email Email do usuário
 * @returns Token JWT assinado
 */
export async function generateTestToken(
  jwtService: JwtService,
  userId: number,
  email: string,
): Promise<string> {
  const payload = { sub: userId, email };
  return jwtService.signAsync(payload);
}

/**
 * Limpa todos os usuários de teste de autenticação
 *
 * @param knex Instância do Knex
 * @param email Email do usuário de teste a ser removido
 */
export async function clearAuthTestUsers(
  knex: Knex,
  email: string = 'authtest@example.com',
): Promise<void> {
  await knex('users').where({ email }).delete();
}

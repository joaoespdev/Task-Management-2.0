import * as bcrypt from 'bcrypt';
import { Knex } from 'knex';

export interface SeedUser {
  id?: number;
  name: string;
  email: string;
  password: string;
}

/**
 * Cria um usuário no banco de dados para testes
 *
 * @param knex Instância do Knex
 * @param userData Dados do usuário (sem hash na senha)
 * @returns O usuário criado (sem a senha)
 */
export async function createTestUser(
  knex: Knex,
  userData: SeedUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  },
): Promise<{ id: number; name: string; email: string }> {
  // Hash da senha
  const password = await bcrypt.hash(userData.password, 10);

  // Inserir usuário no banco
  const [user] = await knex('users')
    .insert({
      name: userData.name,
      email: userData.email,
      password,
    })
    .returning(['id', 'name', 'email']);

  return user;
}

/**
 * Cria múltiplos usuários no banco de dados para testes
 *
 * @param knex Instância do Knex
 * @param count Número de usuários a criar
 * @returns Array de usuários criados (sem senhas)
 */
export async function createMultipleTestUsers(
  knex: Knex,
  count: number = 3,
): Promise<any[]> {
  const users = [];

  // Criar `count` usuários
  for (let i = 1; i <= count; i++) {
    const user = await createTestUser(knex, {
      name: `Test User ${i}`,
      email: `test${i}@example.com`,
      password: 'password123',
    });
    users.push(user);
  }

  return users;
}

/**
 * Limpa todos os usuários da tabela
 *
 * @param knex Instância do Knex
 */
export async function clearUsers(knex: Knex): Promise<void> {
  await knex('users').delete();
}

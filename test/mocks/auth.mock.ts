import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/interfaces/user.interface';
import { LoginDto } from '../../src/dto/login-dto';

// Usuário completo para testes
export const mockAuthUser: User = {
  id: 1,
  name: 'Auth Test User',
  email: 'authtest@example.com',
  password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678', // Hash fictício
  created_at: new Date('2025-09-01T00:00:00.000Z'),
  updated_at: new Date('2025-09-01T00:00:00.000Z'),
};

// Dados para login
export const mockLoginDto: LoginDto = {
  email: 'authtest@example.com',
  password: 'password123',
};

// Resposta do login bem-sucedido
export const mockLoginResponse = {
  access_token: 'mock-jwt-token',
  user: {
    id: 1,
    name: 'Auth Test User',
    email: 'authtest@example.com',
  },
};

// Payload JWT
export const mockJwtPayload = {
  sub: 1,
  email: 'authtest@example.com',
  iat: 1631234567,
  exp: 1631238167,
};

// Mock do JwtService
export class MockJwtService {
  async signAsync(payload: any) {
    return 'mock-jwt-token';
  }

  verifyAsync(token: string) {
    if (token === 'valid-token') {
      return mockJwtPayload;
    }
    throw new Error('Invalid token');
  }
}

// Função para criar um mock do Knex para autenticação
export const createAuthKnexMock = () => {
  return {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockImplementation((email) => {
      if (email === 'nonexistent@example.com') {
        return null;
      }
      return mockAuthUser;
    }),
  };
};

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockKnex: any;

  beforeEach(async () => {
    // Mock do Knex
    mockKnex = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
        {
          provide: 'KNEX_CONNECTION',
          useValue: () => mockKnex,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('deve validar um usuário com credenciais corretas', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockKnex.first.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      // Act
      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      // Assert
      expect(mockKnex.where).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed_password',
      );
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se o email não existir', async () => {
      // Arrange
      mockKnex.first.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(NotFoundException);

      expect(mockKnex.where).toHaveBeenCalledWith({
        email: 'nonexistent@example.com',
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se a senha for inválida', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockKnex.first.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      // Act & Assert
      await expect(
        service.validateUser('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockKnex.where).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-password',
        'hashed_password',
      );
    });
  });

  describe('login', () => {
    it('deve gerar token JWT para usuário válido', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValueOnce(mockUser);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('mock-jwt-token');

      // Act
      const result = await service.login('test@example.com', 'password123');

      // Assert
      expect(service.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });

    it('deve repassar exceções de validação', async () => {
      // Arrange
      jest
        .spyOn(service, 'validateUser')
        .mockRejectedValueOnce(
          new NotFoundException('Email não encontrado no sistema.'),
        );

      // Act & Assert
      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow(NotFoundException);

      expect(service.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});

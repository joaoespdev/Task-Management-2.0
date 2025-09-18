import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  mockUserComplete,
  mockUserResponse,
  mockUsersList,
  mockCreateUserDto,
  mockUpdateUserDto,
  mockUpdatePasswordDto,
  createKnexMock,
} from '../../test/mocks/users.mock';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let mockKnex: any;

  beforeEach(async () => {
    mockKnex = createKnexMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: () => mockKnex,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('deve criar um usuário com senha criptografada', async () => {
      mockKnex.first.mockResolvedValueOnce(null);
      mockKnex.returning.mockResolvedValueOnce([mockUserResponse]);

      const result = await service.createUser(
        mockCreateUserDto.name,
        mockCreateUserDto.email,
        mockCreateUserDto.password,
      );

      expect(mockKnex.where).toHaveBeenCalledWith({
        email: mockCreateUserDto.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(mockKnex.insert).toHaveBeenCalledWith({
        name: mockCreateUserDto.name,
        email: mockCreateUserDto.email,
        password: 'hashed-password',
      });

      expect(result).toEqual(mockUserResponse);
    });

    it('deve lançar ConflictException se email já existe', async () => {
      mockKnex.first.mockResolvedValueOnce({
        id: 1,
        email: mockCreateUserDto.email,
      });

      await expect(
        service.createUser(
          mockCreateUserDto.name,
          mockCreateUserDto.email,
          mockCreateUserDto.password,
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockKnex.insert).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('deve encontrar um usuário por ID e omitir a senha', async () => {
      mockKnex.first.mockResolvedValueOnce(mockUserComplete);

      const result = await service.findById(1);

      expect(mockKnex.where).toHaveBeenCalledWith({ id: 1 });

      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar NotFoundException se o usuário não existir', async () => {
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUsers', () => {
    it('deve retornar a lista de usuários', async () => {
      mockKnex.select.mockResolvedValueOnce(mockUsersList);

      const result = await service.listUsers();

      expect(mockKnex.select).toHaveBeenCalledWith('id', 'name', 'email');

      expect(result).toEqual(mockUsersList);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateUser', () => {
    it('deve atualizar o nome do usuário', async () => {
      mockKnex.first.mockResolvedValueOnce(mockUserComplete);
      mockKnex.returning.mockResolvedValueOnce([
        {
          ...mockUserResponse,
          name: mockUpdateUserDto.name,
        },
      ]);

      const result = await service.updateUser(1, mockUpdateUserDto);

      expect(mockKnex.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockKnex.update).toHaveBeenCalledWith(mockUpdateUserDto);

      expect(result).toHaveProperty('name', mockUpdateUserDto.name);
    });

    it('deve criptografar a senha ao atualizar', async () => {
      mockKnex.first.mockResolvedValueOnce(mockUserComplete);
      mockKnex.returning.mockResolvedValueOnce([mockUserResponse]);

      await service.updateUser(1, mockUpdatePasswordDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        mockUpdatePasswordDto.password,
        10,
      );
      expect(mockKnex.update).toHaveBeenCalledWith({
        password: 'hashed-password',
      });
    });

    it('deve lançar NotFoundException se o usuário não existir', async () => {
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(service.updateUser(999, mockUpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockKnex.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('deve excluir um usuário existente', async () => {
      mockKnex.first.mockResolvedValueOnce(mockUserComplete);

      const result = await service.deleteUser(1);

      expect(mockKnex.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockKnex.delete).toHaveBeenCalled();

      expect(result).toEqual({ message: 'Usuário removido com sucesso' });
    });

    it('deve lançar NotFoundException se o usuário não existir', async () => {
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(service.deleteUser(999)).rejects.toThrow(NotFoundException);

      expect(mockKnex.delete).not.toHaveBeenCalled();
    });
  });
});

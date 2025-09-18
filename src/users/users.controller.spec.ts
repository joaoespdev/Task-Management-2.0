import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import {
  mockUserResponse,
  mockUsersList,
  mockCreateUserDto,
  mockUpdateUserDto,
} from '../../test/mocks/users.mock';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const mockUsersService = {
      createUser: jest.fn(),
      findById: jest.fn(),
      listUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('deve registrar um novo usuário', async () => {
      jest
        .spyOn(usersService, 'createUser')
        .mockResolvedValue(mockUserResponse);

      const result = await controller.register(mockCreateUserDto);

      expect(usersService.createUser).toHaveBeenCalledWith(
        mockCreateUserDto.name,
        mockCreateUserDto.email,
        mockCreateUserDto.password,
      );

      expect(result).toEqual(mockUserResponse);
    });

    it('deve repassar exceção do service', async () => {
      jest
        .spyOn(usersService, 'createUser')
        .mockRejectedValue(new ConflictException('Email já cadastrado'));

      await expect(controller.register(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de usuários', async () => {
      jest.spyOn(usersService, 'listUsers').mockResolvedValue(mockUsersList);

      const result = await controller.findAll();

      expect(usersService.listUsers).toHaveBeenCalled();

      expect(result).toEqual(mockUsersList);
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário pelo ID', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUserResponse);

      const result = await controller.findById(1);

      expect(usersService.findById).toHaveBeenCalledWith(1);

      expect(result).toEqual(mockUserResponse);
    });

    it('deve repassar exceção do service', async () => {
      jest
        .spyOn(usersService, 'findById')
        .mockRejectedValue(new NotFoundException('Usuário não encontrado'));

      await expect(controller.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário', async () => {
      const updatedUser = { ...mockUserResponse, name: mockUpdateUserDto.name };
      jest.spyOn(usersService, 'updateUser').mockResolvedValue(updatedUser);

      const result = await controller.update(1, mockUpdateUserDto);

      expect(usersService.updateUser).toHaveBeenCalledWith(
        1,
        mockUpdateUserDto,
      );

      expect(result).toEqual(updatedUser);
      expect(result.name).toBe(mockUpdateUserDto.name);
    });
  });

  describe('remove', () => {
    it('deve remover um usuário', async () => {
      const mockResponse = { message: 'Usuário removido com sucesso' };
      jest.spyOn(usersService, 'deleteUser').mockResolvedValue(mockResponse);

      const result = await controller.remove(1);

      expect(usersService.deleteUser).toHaveBeenCalledWith(1);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('simpleTest', () => {
    it('deve retornar uma mensagem simples', () => {
      const result = controller.simpleTest();

      expect(result).toEqual({
        message: 'Esta rota funciona sem banco de dados!',
      });
    });
  });
});

import { User } from '../../src/interfaces/user.interface';
import { CreateUserDto } from '../../src/dto/create-user.dto';
import { UpdateUserDto } from '../../src/dto/update-user.dto';

export const mockUserComplete: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678',
  created_at: new Date('2025-09-01T00:00:00.000Z'),
  updated_at: new Date('2025-09-01T00:00:00.000Z'),
};

export const mockUserResponse = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
};

export const mockUsersList = [
  { id: 1, name: 'User 1', email: 'user1@example.com' },
  { id: 2, name: 'User 2', email: 'user2@example.com' },
];

export const mockCreateUserDto: CreateUserDto = {
  name: 'New User',
  email: 'new@example.com',
  password: 'password123',
};

export const mockUpdateUserDto: UpdateUserDto = {
  name: 'Updated Name',
};

export const mockUpdatePasswordDto: UpdateUserDto = {
  password: 'newpassword123',
};

export const createKnexMock = () => {
  return {
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockResolvedValue(1),
  };
};

import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('User DTOs', () => {
  describe('CreateUserDto', () => {
    it('deve validar um DTO com dados corretos', async () => {
      // Criar DTO a partir de objeto
      const dto = plainToClass(CreateUserDto, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar se o nome estiver ausente', async () => {
      // Criar DTO sem nome
      const dto = plainToClass(CreateUserDto, {
        email: 'test@example.com',
        password: 'password123',
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('deve rejeitar se o email for inválido', async () => {
      // Criar DTO com email inválido
      const dto = plainToClass(CreateUserDto, {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('deve rejeitar se a senha for muito curta', async () => {
      // Criar DTO com senha curta
      const dto = plainToClass(CreateUserDto, {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345', // Menos de 6 caracteres
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });

  describe('UpdateUserDto', () => {
    it('deve validar um DTO com dados corretos', async () => {
      // Criar DTO a partir de objeto
      const dto = plainToClass(UpdateUserDto, {
        name: 'Updated Name',
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar um DTO apenas com senha', async () => {
      // Criar DTO apenas com senha
      const dto = plainToClass(UpdateUserDto, {
        password: 'newpassword123',
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar um DTO apenas com email', async () => {
      // Criar DTO apenas com email
      const dto = plainToClass(UpdateUserDto, {
        email: 'new@example.com',
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar se o email for inválido', async () => {
      // Criar DTO com email inválido
      const dto = plainToClass(UpdateUserDto, {
        email: 'invalid-email',
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('deve rejeitar se a senha for muito curta', async () => {
      // Criar DTO com senha curta
      const dto = plainToClass(UpdateUserDto, {
        password: '12345', // Menos de 6 caracteres
      });

      // Validar DTO
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });
});

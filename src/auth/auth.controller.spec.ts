import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { mockLoginDto, mockLoginResponse } from '../../test/mocks/auth.mock';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      jest.spyOn(authService, 'login').mockResolvedValueOnce(mockLoginResponse);

      const result = await controller.login(mockLoginDto);

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginDto.email,
        mockLoginDto.password,
      );
      expect(result).toEqual(mockLoginResponse);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('deve repassar exceções do service', async () => {
      jest
        .spyOn(authService, 'login')
        .mockRejectedValueOnce(
          new UnauthorizedException(
            'Senha inválida, tente novamente por favor.',
          ),
        );

      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginDto.email,
        mockLoginDto.password,
      );
    });
  });
});

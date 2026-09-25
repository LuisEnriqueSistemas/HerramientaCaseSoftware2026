import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    executeRegister: jest.fn(),
    executeLogin: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const registerDto: RegisterUserDto = {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    password: 'secreto123',
  };
  const loginDto: LoginUserDto = {
    email: 'juan@example.com',
    password: 'secreto123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService);
  });

  it('delega el registro en el caso de uso executeRegister', async () => {
    const user = {
      id: 'user-id-1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    (authService.executeRegister as jest.Mock).mockResolvedValue(user);

    const result = await controller.register(registerDto);

    expect(authService.executeRegister).toHaveBeenCalledWith(registerDto);
    expect(result).toBe(user);
  });

  it('delega el login en el caso de uso executeLogin', async () => {
    const response = {
      access_token: 'jwt-token',
      user: { id: 'user-id-1' } as UserResponseDto,
    };
    (authService.executeLogin as jest.Mock).mockResolvedValue(response);

    const result = await controller.login(loginDto);

    expect(authService.executeLogin).toHaveBeenCalledWith(loginDto);
    expect(result).toBe(response);
  });
});

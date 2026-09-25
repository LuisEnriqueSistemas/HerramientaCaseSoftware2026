import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersRepository } from '../users/repositories/users-repository.interface';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcryptjs';

const mockedHash = bcrypt.hash as jest.Mock;
const mockedCompare = bcrypt.compare as jest.Mock;

const baseUser: User = {
  id: 'user-id-1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  passwordHash: 'hashed-password',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const registerDto: RegisterUserDto = {
  name: 'Juan Pérez',
  email: 'juan@example.com',
  password: 'secreto123',
};

const loginDto: LoginUserDto = {
  email: 'juan@example.com',
  password: 'secreto123',
};

function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

describe('AuthService', () => {
  let authService: AuthService;
  const usersRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createAndSave: jest.fn(),
  } as unknown as jest.Mocked<UsersRepository>;
  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(usersRepository, jwtService);
  });

  describe('executeRegister (CU-01 Registrar cuenta)', () => {
    it('registra una cuenta nueva cuando el correo está disponible', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      mockedHash.mockResolvedValue('hashed-password');
      (usersRepository.createAndSave as jest.Mock).mockResolvedValue(baseUser);

      const result = await authService.executeRegister(registerDto);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockedHash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersRepository.createAndSave).toHaveBeenCalledWith({
        name: registerDto.name,
        email: registerDto.email,
        passwordHash: 'hashed-password',
      });
      expect(result).toEqual(toUserResponse(baseUser));
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('lanza ConflictException cuando el correo ya está registrado (E1)', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(baseUser);

      await expect(authService.executeRegister(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockedHash).not.toHaveBeenCalled();
      expect(usersRepository.createAndSave).not.toHaveBeenCalled();
    });
  });

  describe('executeLogin (CU-02 Autenticar usuario)', () => {
    it('autentica al usuario y genera un token JWT', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(baseUser);
      mockedCompare.mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock).mockResolvedValue('jwt-token');

      const result = await authService.executeLogin(loginDto);

      expect(mockedCompare).toHaveBeenCalledWith(
        loginDto.password,
        baseUser.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: baseUser.id,
        email: baseUser.email,
      });
      expect(result.access_token).toBe('jwt-token');
      expect(result.user).toEqual(toUserResponse(baseUser));
    });

    it('lanza UnauthorizedException cuando el usuario no existe (E1)', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.executeLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockedCompare).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('lanza UnauthorizedException cuando la contraseña es incorrecta (E1)', async () => {
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(baseUser);
      mockedCompare.mockResolvedValue(false);

      await expect(authService.executeLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users-repository.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcryptjs';

const mockedHash = bcrypt.hash as jest.Mock;

const baseUser: User = {
  id: 'user-id-1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  passwordHash: 'hashed-password',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const expectedResponse = {
  id: baseUser.id,
  name: baseUser.name,
  email: baseUser.email,
  createdAt: baseUser.createdAt,
};

describe('UsersService (CU-04 Gestionar perfil)', () => {
  let usersService: UsersService;
  const usersRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createAndSave: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<UsersRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    usersService = new UsersService(usersRepository);
  });

  describe('findById (Consultar perfil)', () => {
    it('devuelve el perfil del usuario autenticado', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser);

      const result = await usersService.findById('user-id-1');

      expect(usersRepository.findById).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(expectedResponse);
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usersService.findById('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update (Actualizar perfil)', () => {
    it('actualiza solo los campos enviados sin password', async () => {
      const dto: UpdateProfileDto = { name: 'Ana García' };
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser);
      (usersRepository.update as jest.Mock).mockImplementation(
        (id: string, data: Partial<User>) => ({ ...baseUser, ...data }),
      );

      const result = await usersService.update('user-id-1', dto);

      expect(usersRepository.update).toHaveBeenCalledWith('user-id-1', {
        name: 'Ana García',
      });
      expect(result.name).toBe('Ana García');
    });

    it('cifra la contraseña con bcrypt cuando cambia', async () => {
      const dto: UpdateProfileDto = { password: 'nueva123' };
      mockedHash.mockResolvedValue('nuevo-hash');
      (usersRepository.update as jest.Mock).mockImplementation(
        (id: string, data: Partial<User>) => ({ ...baseUser, ...data }),
      );

      const result = await usersService.update('user-id-1', dto);

      expect(mockedHash).toHaveBeenCalledWith('nueva123', 10);
      expect(usersRepository.update).toHaveBeenCalledWith('user-id-1', {
        passwordHash: 'nuevo-hash',
      });
      expect(result.email).toBe(baseUser.email);
    });

    it('lanza ConflictException si el email pertenece a otra cuenta (E2)', async () => {
      const dto: UpdateProfileDto = { email: 'otro@example.com' };
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...baseUser,
        id: 'otro-usuario',
      });

      await expect(usersService.update('user-id-1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.update).not.toHaveBeenCalled();
    });

    it('permite conservar el propio email (sin falso conflicto)', async () => {
      const dto: UpdateProfileDto = { email: 'juan@example.com' };
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(baseUser);
      (usersRepository.update as jest.Mock).mockResolvedValue(baseUser);

      const result = await usersService.update('user-id-1', dto);

      expect(usersRepository.update).toHaveBeenCalledWith('user-id-1', {
        email: 'juan@example.com',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('lanza NotFoundException si el usuario a actualizar no existe', async () => {
      const dto: UpdateProfileDto = { name: 'Ana' };
      (usersRepository.update as jest.Mock).mockResolvedValue(null);

      await expect(usersService.update('no-existe', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove (Eliminar cuenta)', () => {
    it('elimina la cuenta del usuario', async () => {
      (usersRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await usersService.remove('user-id-1');

      expect(usersRepository.remove).toHaveBeenCalledWith('user-id-1');
    });
  });
});

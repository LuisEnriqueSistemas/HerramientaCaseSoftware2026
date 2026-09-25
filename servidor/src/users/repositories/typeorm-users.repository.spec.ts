import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { TypeOrmUsersRepository } from './typeorm-users.repository';

describe('TypeOrmUsersRepository', () => {
  let repository: TypeOrmUsersRepository;
  const typeOrmRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TypeOrmUsersRepository(typeOrmRepo);
  });

  describe('findByEmail', () => {
    it('devuelve el usuario encontrado por email', async () => {
      const user = { id: 'user-id-1', email: 'juan@example.com' } as User;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(user);

      const result = await repository.findByEmail('juan@example.com');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'juan@example.com' },
      });
      expect(result).toBe(user);
    });

    it('devuelve null cuando no existe el usuario', async () => {
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByEmail('nadie@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('devuelve el usuario encontrado por id', async () => {
      const user = { id: 'user-id-1', email: 'juan@example.com' } as User;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(user);

      const result = await repository.findById('user-id-1');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
      expect(result).toBe(user);
    });

    it('devuelve null cuando no existe el usuario', async () => {
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('no-existe');

      expect(result).toBeNull();
    });
  });

  describe('findManyByIds', () => {
    it('devuelve [] sin consultar cuando no hay ids', async () => {
      const result = await repository.findManyByIds([]);

      expect(typeOrmRepo.find).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('busca los usuarios por sus ids', async () => {
      const users = [
        { id: 'u-1', email: 'a@example.com' },
        { id: 'u-2', email: 'b@example.com' },
      ] as User[];
      (typeOrmRepo.find as jest.Mock).mockResolvedValue(users);

      const result = await repository.findManyByIds(['u-1', 'u-2']);

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: [{ id: 'u-1' }, { id: 'u-2' }],
      });
      expect(result).toBe(users);
    });
  });

  describe('createAndSave', () => {
    it('crea y persiste un nuevo usuario', async () => {
      const data = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        passwordHash: 'hashed-password',
      };
      const user = { id: 'user-id-1', ...data } as User;
      (typeOrmRepo.create as jest.Mock).mockReturnValue(user);
      (typeOrmRepo.save as jest.Mock).mockResolvedValue(user);

      const result = await repository.createAndSave(data);

      expect(typeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });
  });

  describe('update', () => {
    const baseUser = {
      id: 'user-id-1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      passwordHash: 'hashed-password',
    } as User;

    it('actualiza los datos y persiste la entidad', async () => {
      const updatedUser = { ...baseUser, name: 'Ana García' };
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(baseUser);
      (typeOrmRepo.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await repository.update('user-id-1', {
        name: 'Ana García',
      });

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
      expect(typeOrmRepo.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toBe(updatedUser);
    });

    it('devuelve null cuando el usuario no existe', async () => {
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.update('no-existe', { name: 'Ana' });

      expect(result).toBeNull();
      expect(typeOrmRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina el usuario de la base de datos', async () => {
      (typeOrmRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await repository.remove('user-id-1');

      expect(typeOrmRepo.delete).toHaveBeenCalledWith('user-id-1');
    });
  });
});

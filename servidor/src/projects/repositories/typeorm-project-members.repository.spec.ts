import { Repository } from 'typeorm';
import { ProjectMember } from '../entities/project-member.entity';
import { TypeOrmProjectMembersRepository } from './typeorm-project-members.repository';

describe('TypeOrmProjectMembersRepository', () => {
  let repository: TypeOrmProjectMembersRepository;
  const typeOrmRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<ProjectMember>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TypeOrmProjectMembersRepository(typeOrmRepo);
  });

  describe('add', () => {
    it('crea y persiste un miembro', async () => {
      const data = {
        projectId: 'p-1',
        userId: 'u-1',
        role: 'EDITOR' as const,
      };
      const member = { id: 'm-1', ...data } as ProjectMember;
      (typeOrmRepo.create as jest.Mock).mockReturnValue(member);
      (typeOrmRepo.save as jest.Mock).mockResolvedValue(member);

      const result = await repository.add('p-1', 'u-1', 'EDITOR' as never);

      expect(typeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(member);
      expect(result).toBe(member);
    });
  });

  describe('updateRole', () => {
    it('actualiza el rol y persiste', async () => {
      const member = {
        id: 'm-1',
        projectId: 'p-1',
        userId: 'u-1',
        role: 'VIEWER',
      } as ProjectMember;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(member);
      (typeOrmRepo.save as jest.Mock).mockResolvedValue({
        ...member,
        role: 'EDITOR',
      });

      const result = await repository.updateRole(
        'p-1',
        'u-1',
        'EDITOR' as never,
      );

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { projectId: 'p-1', userId: 'u-1' },
      });
      expect(result?.role).toBe('EDITOR');
    });

    it('devuelve null cuando el miembro no existe', async () => {
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.updateRole(
        'p-1',
        'u-9',
        'EDITOR' as never,
      );

      expect(result).toBeNull();
      expect(typeOrmRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('find', () => {
    it('busca una membresía específica', async () => {
      const member = { id: 'm-1' } as ProjectMember;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(member);

      const result = await repository.find('p-1', 'u-1');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { projectId: 'p-1', userId: 'u-1' },
      });
      expect(result).toBe(member);
    });
  });

  describe('remove', () => {
    it('elimina la membresía', async () => {
      (typeOrmRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await repository.remove('p-1', 'u-1');

      expect(typeOrmRepo.delete).toHaveBeenCalledWith({
        projectId: 'p-1',
        userId: 'u-1',
      });
    });
  });

  describe('removeByProject', () => {
    it('elimina todas las membresías del proyecto', async () => {
      await repository.removeByProject('p-1');

      expect(typeOrmRepo.delete).toHaveBeenCalledWith({ projectId: 'p-1' });
    });
  });

  describe('listByProject / listByUser', () => {
    it('lista por proyecto y por usuario', async () => {
      (typeOrmRepo.find as jest.Mock).mockResolvedValue([]);

      await repository.listByProject('p-1');
      await repository.listByUser('u-1');

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { projectId: 'p-1' },
      });
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
      });
    });
  });
});

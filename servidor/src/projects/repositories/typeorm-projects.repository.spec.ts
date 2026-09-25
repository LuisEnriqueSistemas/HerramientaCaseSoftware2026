import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { TypeOrmProjectsRepository } from './typeorm-projects.repository';

describe('TypeOrmProjectsRepository', () => {
  let repository: TypeOrmProjectsRepository;
  const typeOrmRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<Project>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TypeOrmProjectsRepository(typeOrmRepo);
  });

  describe('createAndSave', () => {
    it('crea y persiste un proyecto', async () => {
      const data = {
        name: 'Sistema de Ventas',
        description: null,
        createdBy: 'user-id-1',
      };
      const project = { id: 'project-id-1', ...data } as Project;
      (typeOrmRepo.create as jest.Mock).mockReturnValue(project);
      (typeOrmRepo.save as jest.Mock).mockResolvedValue(project);

      const result = await repository.createAndSave(data);

      expect(typeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(project);
      expect(result).toBe(project);
    });
  });

  describe('findByIds', () => {
    it('devuelve [] sin consultar cuando no hay ids', async () => {
      const result = await repository.findByIds([]);

      expect(typeOrmRepo.find).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('busca los proyectos por sus ids', async () => {
      const projects = [
        { id: 'p-1', name: 'A' },
        { id: 'p-2', name: 'B' },
      ] as Project[];
      (typeOrmRepo.find as jest.Mock).mockResolvedValue(projects);

      const result = await repository.findByIds(['p-1', 'p-2']);

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: [{ id: 'p-1' }, { id: 'p-2' }],
      });
      expect(result).toBe(projects);
    });
  });

  describe('findById', () => {
    it('devuelve el proyecto encontrado', async () => {
      const project = { id: 'p-1' } as Project;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(project);

      const result = await repository.findById('p-1');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'p-1' },
      });
      expect(result).toBe(project);
    });
  });

  describe('remove', () => {
    it('elimina el proyecto', async () => {
      (typeOrmRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await repository.remove('p-1');

      expect(typeOrmRepo.delete).toHaveBeenCalledWith('p-1');
    });
  });
});

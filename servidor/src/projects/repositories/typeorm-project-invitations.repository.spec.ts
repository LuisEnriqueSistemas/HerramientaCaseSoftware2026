import { Repository } from 'typeorm';
import { ProjectInvitation } from '../entities/project-invitation.entity';
import { ProjectInvitationStatus } from '../entities/project-invitation.entity';
import { TypeOrmProjectInvitationsRepository } from './typeorm-project-invitations.repository';

describe('TypeOrmProjectInvitationsRepository', () => {
  let repository: TypeOrmProjectInvitationsRepository;
  const typeOrmRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<ProjectInvitation>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TypeOrmProjectInvitationsRepository(typeOrmRepo);
  });

  describe('createAndSave', () => {
    it('crea y persiste una invitación', async () => {
      const data = {
        projectId: 'p-1',
        invitedByUserId: 'u-host',
        email: 'ana@example.com',
        role: 'EDITOR' as const,
      };
      const invitation = { id: 'i-1', ...data } as ProjectInvitation;
      (typeOrmRepo.create as jest.Mock).mockReturnValue(invitation);
      (typeOrmRepo.save as jest.Mock).mockResolvedValue(invitation);

      const result = await repository.createAndSave(data);

      expect(typeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(invitation);
      expect(result).toBe(invitation);
    });
  });

  describe('findPendingByEmail', () => {
    it('busca invitaciones pendientes ordenadas por creación descendente', async () => {
      (typeOrmRepo.find as jest.Mock).mockResolvedValue([]);

      await repository.findPendingByEmail('ana@example.com');

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: {
          email: 'ana@example.com',
          status: ProjectInvitationStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findPendingByProjectAndEmail', () => {
    it('busca una invitación pendiente específica', async () => {
      const invitation = { id: 'i-1' } as ProjectInvitation;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(invitation);

      const result = await repository.findPendingByProjectAndEmail(
        'p-1',
        'ana@example.com',
      );

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: {
          projectId: 'p-1',
          email: 'ana@example.com',
          status: ProjectInvitationStatus.PENDING,
        },
      });
      expect(result).toBe(invitation);
    });
  });

  describe('updateStatus', () => {
    it('actualiza el estado y persiste', async () => {
      const invitation = {
        id: 'i-1',
        status: ProjectInvitationStatus.PENDING,
      } as ProjectInvitation;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(invitation);
      (typeOrmRepo.save as jest.Mock).mockResolvedValue({
        ...invitation,
        status: ProjectInvitationStatus.ACCEPTED,
      });

      const result = await repository.updateStatus(
        'i-1',
        ProjectInvitationStatus.ACCEPTED,
      );

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'i-1' },
      });
      expect(result?.status).toBe(ProjectInvitationStatus.ACCEPTED);
    });

    it('devuelve null cuando la invitación no existe', async () => {
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.updateStatus(
        'no-existe',
        ProjectInvitationStatus.REJECTED,
      );

      expect(result).toBeNull();
      expect(typeOrmRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('devuelve la invitación encontrada', async () => {
      const invitation = { id: 'i-1' } as ProjectInvitation;
      (typeOrmRepo.findOne as jest.Mock).mockResolvedValue(invitation);

      const result = await repository.findById('i-1');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'i-1' },
      });
      expect(result).toBe(invitation);
    });
  });

  describe('removeByProject', () => {
    it('elimina las invitaciones del proyecto', async () => {
      await repository.removeByProject('p-1');

      expect(typeOrmRepo.delete).toHaveBeenCalledWith({ projectId: 'p-1' });
    });
  });
});

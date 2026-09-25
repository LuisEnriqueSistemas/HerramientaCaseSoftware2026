import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { ProjectInvitationStatus } from './entities/project-invitation.entity';
import { ProjectMemberRole } from './entities/project-member.entity';
import { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { ProjectsRepository } from './repositories/projects-repository.interface';
import { InvitationsService } from './invitations.service';

const baseUser = (): User => ({
  id: 'user-id-1',
  name: 'Ana García',
  email: 'ana@example.com',
  passwordHash: 'hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

const pendingInvitation = () => ({
  id: 'inv-id-1',
  projectId: 'project-id-1',
  invitedByUserId: 'user-host',
  email: 'ana@example.com',
  role: ProjectMemberRole.EDITOR,
  status: ProjectInvitationStatus.PENDING,
  createdAt: new Date('2026-01-02T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
});

describe('InvitationsService (CU-07 Responder invitaciones)', () => {
  let service: InvitationsService;
  const invitationsRepository = {
    createAndSave: jest.fn(),
    findById: jest.fn(),
    findPendingByEmail: jest.fn(),
    findPendingByProjectAndEmail: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<ProjectInvitationsRepository>;
  const membersRepository = {
    add: jest.fn(),
    find: jest.fn(),
    listByProject: jest.fn(),
    listByUser: jest.fn(),
    updateRole: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProjectMembersRepository>;
  const projectsRepository = {
    createAndSave: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProjectsRepository>;
  const usersRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findManyByIds: jest.fn(),
    createAndSave: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<
    import('../users/repositories/users-repository.interface').UsersRepository
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvitationsService(
      invitationsRepository,
      membersRepository,
      projectsRepository,
      usersRepository,
    );
  });

  describe('listPending', () => {
    it('devuelve las invitaciones pendientes con el nombre del proyecto', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findPendingByEmail as jest.Mock).mockResolvedValue(
        [pendingInvitation()],
      );
      (projectsRepository.findByIds as jest.Mock).mockResolvedValue([
        {
          id: 'project-id-1',
          name: 'Sistema de Ventas',
          description: null,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);

      const result = await service.listPending('user-id-1');

      expect(invitationsRepository.findPendingByEmail).toHaveBeenCalledWith(
        'ana@example.com',
      );
      expect(result).toEqual([
        {
          id: 'inv-id-1',
          projectId: 'project-id-1',
          projectName: 'Sistema de Ventas',
          email: 'ana@example.com',
          role: ProjectMemberRole.EDITOR,
          status: ProjectInvitationStatus.PENDING,
          createdAt: pendingInvitation().createdAt,
        },
      ]);
    });

    it('omite invitaciones de proyectos inexistentes', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findPendingByEmail as jest.Mock).mockResolvedValue(
        [pendingInvitation()],
      );
      (projectsRepository.findByIds as jest.Mock).mockResolvedValue([]);

      const result = await service.listPending('user-id-1');

      expect(result).toEqual([]);
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.listPending('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('accept', () => {
    it('marca la invitación como aceptada y agrega el miembro', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue(
        pendingInvitation(),
      );
      (membersRepository.find as jest.Mock).mockResolvedValue(null);
      (invitationsRepository.updateStatus as jest.Mock).mockResolvedValue(
        pendingInvitation(),
      );
      (membersRepository.add as jest.Mock).mockResolvedValue({});

      await service.accept('user-id-1', 'inv-id-1');

      expect(invitationsRepository.updateStatus).toHaveBeenCalledWith(
        'inv-id-1',
        ProjectInvitationStatus.ACCEPTED,
      );
      expect(membersRepository.add).toHaveBeenCalledWith(
        'project-id-1',
        'user-id-1',
        ProjectMemberRole.EDITOR,
      );
    });

    it('lanza NotFoundException cuando la invitación no existe', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.accept('user-id-1', 'no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException cuando la invitación no corresponde al usuario', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue({
        ...pendingInvitation(),
        email: 'otro@example.com',
      });

      await expect(service.accept('user-id-1', 'inv-id-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lanza ConflictException cuando la invitación ya fue procesada', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue({
        ...pendingInvitation(),
        status: ProjectInvitationStatus.REJECTED,
      });

      await expect(service.accept('user-id-1', 'inv-id-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza ConflictException cuando el usuario ya es miembro', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue(
        pendingInvitation(),
      );
      (membersRepository.find as jest.Mock).mockResolvedValue({ id: 'm1' });

      await expect(service.accept('user-id-1', 'inv-id-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('reject', () => {
    it('marca la invitación como rechazada', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue(
        pendingInvitation(),
      );

      await service.reject('user-id-1', 'inv-id-1');

      expect(invitationsRepository.updateStatus).toHaveBeenCalledWith(
        'inv-id-1',
        ProjectInvitationStatus.REJECTED,
      );
    });

    it('lanza NotFoundException cuando la invitación no existe', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.reject('user-id-1', 'no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException cuando la invitación no corresponde', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(baseUser());
      (invitationsRepository.findById as jest.Mock).mockResolvedValue({
        ...pendingInvitation(),
        email: 'otro@example.com',
      });

      await expect(service.reject('user-id-1', 'inv-id-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

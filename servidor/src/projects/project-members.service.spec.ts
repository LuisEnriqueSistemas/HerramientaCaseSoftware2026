import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { UsersRepository } from '../users/repositories/users-repository.interface';
import { ProjectMemberRole } from './entities/project-member.entity';
import { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import { ProjectsRepository } from './repositories/projects-repository.interface';
import { InviteRole } from './dto/invite-user.dto';
import { ProjectMembersService } from './project-members.service';
import { ProjectsGateway } from './projects.gateway';

const host = (): User => ({
  id: 'user-host',
  name: 'Carlos Host',
  email: 'host@example.com',
  passwordHash: 'hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

describe('ProjectMembersService (CU-06 Invitar miembros)', () => {
  let service: ProjectMembersService;
  const membersRepository = {
    add: jest.fn(),
    find: jest.fn(),
    listByProject: jest.fn(),
    listByUser: jest.fn(),
    updateRole: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProjectMembersRepository>;
  const invitationsRepository = {
    createAndSave: jest.fn(),
    findById: jest.fn(),
    findPendingByEmail: jest.fn(),
    findPendingByProjectAndEmail: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<ProjectInvitationsRepository>;
  const usersRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findManyByIds: jest.fn(),
    createAndSave: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<UsersRepository>;
  const projectsRepository = {
    createAndSave: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProjectsRepository>;
  const projectsGateway = {
    emitPermissionUpdate: jest.fn(),
    emitUserRemoved: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectsGateway>;

  const hostMembership = {
    id: 'm-host',
    projectId: 'project-id-1',
    userId: 'user-host',
    role: ProjectMemberRole.HOST,
    joinedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectMembersService(
      membersRepository,
      invitationsRepository,
      usersRepository,
      projectsRepository,
      projectsGateway,
    );
  });

  describe('inviteUser', () => {
    it('invita a un usuario registrado con el rol solicitado', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce(null);
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...host(),
        id: 'user-id-2',
        email: 'ana@example.com',
      });
      (
        invitationsRepository.findPendingByProjectAndEmail as jest.Mock
      ).mockResolvedValue(null);
      const invitation = {
        id: 'inv-id-1',
        projectId: 'project-id-1',
        invitedByUserId: 'user-host',
        email: 'ana@example.com',
        role: ProjectMemberRole.EDITOR,
        status: 'PENDING',
        createdAt: new Date('2026-01-02T00:00:00Z'),
      };
      (invitationsRepository.createAndSave as jest.Mock).mockResolvedValue(
        invitation,
      );

      const result = await service.inviteUser(
        'user-host',
        'project-id-1',
        'ana@example.com',
        InviteRole.EDITOR,
      );

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        'ana@example.com',
      );
      expect(invitationsRepository.createAndSave).toHaveBeenCalledWith({
        projectId: 'project-id-1',
        invitedByUserId: 'user-host',
        email: 'ana@example.com',
        role: ProjectMemberRole.EDITOR,
      });
      expect(result).toEqual({
        id: 'inv-id-1',
        projectId: 'project-id-1',
        email: 'ana@example.com',
        role: ProjectMemberRole.EDITOR,
        createdAt: invitation.createdAt,
      });
    });

    it('lanza NotFoundException cuando el actor no es miembro del proyecto', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue(null);

      await expect(
        service.inviteUser(
          'desconocido',
          'project-id-1',
          'ana@example.com',
          InviteRole.VIEWER,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException cuando el actor no es HOST', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue({
        ...hostMembership,
        role: ProjectMemberRole.VIEWER,
      });

      await expect(
        service.inviteUser(
          'user-viewer',
          'project-id-1',
          'ana@example.com',
          InviteRole.EDITOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza BadRequestException cuando el correo no está registrado (E2)', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue(hostMembership);
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.inviteUser(
          'user-host',
          'project-id-1',
          'nadie@example.com',
          InviteRole.EDITOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException cuando te invitas a ti mismo', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue(hostMembership);
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(host());

      await expect(
        service.inviteUser(
          'user-host',
          'project-id-1',
          'host@example.com',
          InviteRole.EDITOR,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException cuando el usuario ya es miembro', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce({ ...hostMembership, userId: 'user-id-2' });
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...host(),
        id: 'user-id-2',
      });

      await expect(
        service.inviteUser(
          'user-host',
          'project-id-1',
          'ana@example.com',
          InviteRole.VIEWER,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException cuando ya existe una invitación pendiente', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue(hostMembership);
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...host(),
        id: 'user-id-2',
      });
      (
        invitationsRepository.findPendingByProjectAndEmail as jest.Mock
      ).mockResolvedValue({ id: 'inv-pendiente' });

      await expect(
        service.inviteUser(
          'user-host',
          'project-id-1',
          'ana@example.com',
          InviteRole.VIEWER,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listMembers', () => {
    it('devuelve los miembros con nombre y correo (HOST o EDITOR)', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue(hostMembership);
      const memberA = {
        id: 'm1',
        projectId: 'project-id-1',
        userId: 'user-id-2',
        role: ProjectMemberRole.EDITOR,
      };
      (membersRepository.listByProject as jest.Mock).mockResolvedValue([
        hostMembership,
        memberA,
      ]);
      (usersRepository.findManyByIds as jest.Mock).mockResolvedValue([
        { id: 'user-host', name: 'Carlos Host', email: 'host@example.com' },
        { id: 'user-id-2', name: 'Ana García', email: 'ana@example.com' },
      ]);

      const result = await service.listMembers('user-host', 'project-id-1');

      expect(usersRepository.findManyByIds).toHaveBeenCalledWith([
        'user-host',
        'user-id-2',
      ]);
      expect(result).toEqual([
        {
          userId: 'user-host',
          name: 'Carlos Host',
          email: 'host@example.com',
          role: ProjectMemberRole.HOST,
        },
        {
          userId: 'user-id-2',
          name: 'Ana García',
          email: 'ana@example.com',
          role: ProjectMemberRole.EDITOR,
        },
      ]);
    });

    it('omite miembros cuyo usuario no existe', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue(hostMembership);
      (membersRepository.listByProject as jest.Mock).mockResolvedValue([
        { ...hostMembership, userId: 'user-eliminado' },
      ]);
      (usersRepository.findManyByIds as jest.Mock).mockResolvedValue([]);

      const result = await service.listMembers('user-host', 'project-id-1');

      expect(result).toEqual([]);
    });

    it('lanza NotFoundException cuando el actor no es miembro', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue(null);

      await expect(
        service.listMembers('desconocido', 'project-id-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException cuando el actor es VIEWER', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValue({
        ...hostMembership,
        role: ProjectMemberRole.VIEWER,
      });

      await expect(
        service.listMembers('user-viewer', 'project-id-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    it('actualiza el rol de otro miembro no propietario', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce({
          ...hostMembership,
          userId: 'user-id-2',
          role: ProjectMemberRole.VIEWER,
        });

      await service.updateMemberRole(
        'user-host',
        'project-id-1',
        'user-id-2',
        InviteRole.EDITOR,
      );

      expect(membersRepository.updateRole).toHaveBeenCalledWith(
        'project-id-1',
        'user-id-2',
        ProjectMemberRole.EDITOR,
      );
      expect(projectsGateway.emitPermissionUpdate).toHaveBeenCalledWith(
        'project-id-1',
        'user-id-2',
        ProjectMemberRole.EDITOR,
      );
    });

    it('lanza BadRequestException al intentar cambiar el propio rol', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValueOnce(
        hostMembership,
      );

      await expect(
        service.updateMemberRole(
          'user-host',
          'project-id-1',
          'user-host',
          InviteRole.EDITOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException cuando el objetivo no es miembro', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce(null);

      await expect(
        service.updateMemberRole(
          'user-host',
          'project-id-1',
          'user-id-9',
          InviteRole.EDITOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException al intentar modificar al propietario', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce({
          ...hostMembership,
          userId: 'user-otro-host',
          role: ProjectMemberRole.HOST,
        });

      await expect(
        service.updateMemberRole(
          'user-host',
          'project-id-1',
          'user-otro-host',
          InviteRole.EDITOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('elimina a otro miembro del proyecto', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce({
          ...hostMembership,
          userId: 'user-id-2',
          role: ProjectMemberRole.EDITOR,
        });

      await service.removeMember('user-host', 'project-id-1', 'user-id-2');

      expect(membersRepository.remove).toHaveBeenCalledWith(
        'project-id-1',
        'user-id-2',
      );
      expect(projectsGateway.emitUserRemoved).toHaveBeenCalledWith(
        'project-id-1',
        'user-id-2',
      );
    });

    it('lanza BadRequestException al intentar eliminarse a sí mismo', async () => {
      (membersRepository.find as jest.Mock).mockResolvedValueOnce(
        hostMembership,
      );

      await expect(
        service.removeMember('user-host', 'project-id-1', 'user-host'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException cuando el objetivo no es miembro', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce(null);

      await expect(
        service.removeMember('user-host', 'project-id-1', 'user-id-9'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException al intentar eliminar al propietario', async () => {
      (membersRepository.find as jest.Mock)
        .mockResolvedValueOnce(hostMembership)
        .mockResolvedValueOnce({
          ...hostMembership,
          userId: 'user-otro-host',
          role: ProjectMemberRole.HOST,
        });

      await expect(
        service.removeMember('user-host', 'project-id-1', 'user-otro-host'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

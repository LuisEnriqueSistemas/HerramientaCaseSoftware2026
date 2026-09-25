import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UmlDiagramRepository } from '../uml/repositories/uml-diagram-repository.interface';
import { ProjectMemberRole } from './entities/project-member.entity';
import { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import { ProjectsRepository } from './repositories/projects-repository.interface';
import { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { ProjectsGateway } from './projects.gateway';
import { ProjectsService } from './projects.service';

describe('ProjectsService (CU-05 Gestionar proyectos)', () => {
  let service: ProjectsService;
  const projectsRepository = {
    createAndSave: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProjectsRepository>;
  const membersRepository = {
    add: jest.fn(),
    find: jest.fn(),
    listByProject: jest.fn(),
    listByUser: jest.fn(),
    updateRole: jest.fn(),
    remove: jest.fn(),
    removeByProject: jest.fn(),
  } as unknown as jest.Mocked<ProjectMembersRepository>;
  const invitationsRepository = {
    createAndSave: jest.fn(),
    findById: jest.fn(),
    findPendingByEmail: jest.fn(),
    findPendingByProjectAndEmail: jest.fn(),
    updateStatus: jest.fn(),
    removeByProject: jest.fn(),
  } as unknown as jest.Mocked<ProjectInvitationsRepository>;
  const umlDiagramRepository = {
    deleteDiagramDataByProject: jest.fn(),
  } as unknown as jest.Mocked<UmlDiagramRepository>;
  const projectsGateway = {
    emitProjectDeleted: jest.fn(),
  } as unknown as jest.Mocked<ProjectsGateway>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(
      projectsRepository,
      membersRepository,
      invitationsRepository,
      umlDiagramRepository,
      projectsGateway,
    );
  });

  describe('createProject', () => {
    it('crea el proyecto y registra al creador como HOST', async () => {
      const project = {
        id: 'project-id-1',
        name: 'Sistema de Ventas',
        description: null,
        createdBy: 'user-id-1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      (projectsRepository.createAndSave as jest.Mock).mockResolvedValue(
        project,
      );

      const result = await service.createProject(
        'user-id-1',
        'Sistema de Ventas',
        null,
      );

      expect(projectsRepository.createAndSave).toHaveBeenCalledWith({
        name: 'Sistema de Ventas',
        description: null,
        createdBy: 'user-id-1',
      });
      expect(membersRepository.add).toHaveBeenCalledWith(
        'project-id-1',
        'user-id-1',
        ProjectMemberRole.HOST,
      );
      expect(result).toEqual({
        id: 'project-id-1',
        name: 'Sistema de Ventas',
        description: null,
        role: ProjectMemberRole.HOST,
        createdAt: project.createdAt,
      });
    });

    it('crea el proyecto con descripción', async () => {
      const project = {
        id: 'project-id-2',
        name: 'App Móvil',
        description: 'Sistema de reservas',
        createdBy: 'user-id-1',
        createdAt: new Date('2026-02-01T00:00:00Z'),
      };
      (projectsRepository.createAndSave as jest.Mock).mockResolvedValue(
        project,
      );

      const result = await service.createProject(
        'user-id-1',
        'App Móvil',
        'Sistema de reservas',
      );

      expect(result.description).toBe('Sistema de reservas');
      expect(membersRepository.add).toHaveBeenCalledWith(
        'project-id-2',
        'user-id-1',
        ProjectMemberRole.HOST,
      );
    });
  });

  describe('listProjectsForUser', () => {
    it('combina membresías con proyectos y ordena por fecha descendente', async () => {
      const members = [
        {
          id: 'm1',
          projectId: 'p-2',
          userId: 'user-id-1',
          role: ProjectMemberRole.EDITOR,
        },
        {
          id: 'm2',
          projectId: 'p-1',
          userId: 'user-id-1',
          role: ProjectMemberRole.HOST,
        },
      ];
      const projects = [
        {
          id: 'p-1',
          name: 'Sistema de Ventas',
          description: null,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
          id: 'p-2',
          name: 'App Móvil',
          description: 'Reservas',
          createdAt: new Date('2026-03-01T00:00:00Z'),
        },
      ];
      (membersRepository.listByUser as jest.Mock).mockResolvedValue(members);
      (projectsRepository.findByIds as jest.Mock).mockResolvedValue(projects);

      const result = await service.listProjectsForUser('user-id-1');

      expect(membersRepository.listByUser).toHaveBeenCalledWith('user-id-1');
      expect(projectsRepository.findByIds).toHaveBeenCalledWith(['p-2', 'p-1']);
      expect(result).toEqual([
        {
          id: 'p-2',
          name: 'App Móvil',
          description: 'Reservas',
          memberRole: ProjectMemberRole.EDITOR,
          createdAt: projects[1].createdAt,
        },
        {
          id: 'p-1',
          name: 'Sistema de Ventas',
          description: null,
          memberRole: ProjectMemberRole.HOST,
          createdAt: projects[0].createdAt,
        },
      ]);
    });

    it('omite proyectos que ya no existen y devuelve lista vacía sin proyectos', async () => {
      const members = [
        {
          id: 'm1',
          projectId: 'p-eliminado',
          userId: 'user-id-1',
          role: ProjectMemberRole.VIEWER,
        },
      ];
      (membersRepository.listByUser as jest.Mock).mockResolvedValue(members);
      (projectsRepository.findByIds as jest.Mock).mockResolvedValue([]);

      const result = await service.listProjectsForUser('user-id-1');

      expect(result).toEqual([]);
    });
  });

  describe('getProjectDetail', () => {
    const project = {
      id: 'project-id-1',
      name: 'Sistema de Ventas',
      description: 'FR',
      createdBy: 'user-id-1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };

    it('devuelve el detalle del proyecto con el rol del usuario', async () => {
      (projectsRepository.findById as jest.Mock).mockResolvedValue(project);
      (membersRepository.find as jest.Mock).mockResolvedValue({
        id: 'm1',
        projectId: 'project-id-1',
        userId: 'user-id-2',
        role: ProjectMemberRole.VIEWER,
      });

      const result = await service.getProjectDetail(
        'user-id-2',
        'project-id-1',
      );

      expect(result).toEqual({
        id: 'project-id-1',
        name: 'Sistema de Ventas',
        description: 'FR',
        createdBy: 'user-id-1',
        memberRole: ProjectMemberRole.VIEWER,
        createdAt: project.createdAt,
      });
    });

    it('lanza NotFoundException cuando el proyecto no existe', async () => {
      (projectsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getProjectDetail('user-id-1', 'no-existe'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException cuando el usuario no es miembro', async () => {
      (projectsRepository.findById as jest.Mock).mockResolvedValue(project);
      (membersRepository.find as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getProjectDetail('user-id-3', 'project-id-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProject', () => {
    const project = {
      id: 'project-id-1',
      name: 'Sistema de Ventas',
      description: null,
      createdBy: 'user-id-1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };

    it('elimina el diagrama, invitaciones, miembros, proyecto y notifica', async () => {
      (projectsRepository.findById as jest.Mock).mockResolvedValue(project);
      (membersRepository.find as jest.Mock).mockResolvedValue({
        id: 'm1',
        projectId: 'project-id-1',
        userId: 'user-id-1',
        role: ProjectMemberRole.HOST,
      });

      await service.deleteProject('user-id-1', 'project-id-1');

      expect(
        umlDiagramRepository.deleteDiagramDataByProject,
      ).toHaveBeenCalledWith('project-id-1');
      expect(invitationsRepository.removeByProject).toHaveBeenCalledWith(
        'project-id-1',
      );
      expect(membersRepository.removeByProject).toHaveBeenCalledWith(
        'project-id-1',
      );
      expect(projectsRepository.remove).toHaveBeenCalledWith('project-id-1');
      expect(projectsGateway.emitProjectDeleted).toHaveBeenCalledWith(
        'project-id-1',
      );
    });

    it('lanza NotFoundException cuando el proyecto no existe', async () => {
      (projectsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteProject('user-id-1', 'no-existe'),
      ).rejects.toThrow(NotFoundException);
      expect(projectsRepository.remove).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el usuario no es miembro', async () => {
      (projectsRepository.findById as jest.Mock).mockResolvedValue(project);
      (membersRepository.find as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteProject('user-id-3', 'project-id-1'),
      ).rejects.toThrow(NotFoundException);
      expect(projectsRepository.remove).not.toHaveBeenCalled();
    });

    it('lanza ForbiddenException cuando el usuario no es HOST', async () => {
      (projectsRepository.findById as jest.Mock).mockResolvedValue(project);
      (membersRepository.find as jest.Mock).mockResolvedValue({
        id: 'm1',
        projectId: 'project-id-1',
        userId: 'user-id-2',
        role: ProjectMemberRole.EDITOR,
      });

      await expect(
        service.deleteProject('user-id-2', 'project-id-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(
        umlDiagramRepository.deleteDiagramDataByProject,
      ).not.toHaveBeenCalled();
      expect(projectsRepository.remove).not.toHaveBeenCalled();
      expect(projectsGateway.emitProjectDeleted).not.toHaveBeenCalled();
    });
  });
});

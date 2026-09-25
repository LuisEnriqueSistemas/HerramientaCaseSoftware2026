import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UML_DIAGRAM_REPOSITORY } from '../uml/repositories/uml-diagram-repository.interface';
import type { UmlDiagramRepository } from '../uml/repositories/uml-diagram-repository.interface';
import { ProjectMemberRole } from './entities/project-member.entity';
import { PROJECT_INVITATIONS_REPOSITORY } from './repositories/project-invitations-repository.interface';
import type { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import { PROJECT_MEMBERS_REPOSITORY } from './repositories/project-members-repository.interface';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { PROJECTS_REPOSITORY } from './repositories/projects-repository.interface';
import type { ProjectsRepository } from './repositories/projects-repository.interface';
import { ProjectsGateway } from './projects.gateway';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly membersRepository: ProjectMembersRepository,
    @Inject(PROJECT_INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: ProjectInvitationsRepository,
    @Inject(UML_DIAGRAM_REPOSITORY)
    private readonly umlDiagramRepository: UmlDiagramRepository,
    private readonly projectsGateway: ProjectsGateway,
  ) {}

  async createProject(
    userId: string,
    name: string,
    description: string | null,
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    role: ProjectMemberRole;
    createdAt: Date;
  }> {
    const project = await this.projectsRepository.createAndSave({
      name,
      description,
      createdBy: userId,
    });
    await this.membersRepository.add(
      project.id,
      userId,
      ProjectMemberRole.HOST,
    );
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      role: ProjectMemberRole.HOST,
      createdAt: project.createdAt,
    };
  }

  async listProjectsForUser(userId: string): Promise<
    {
      id: string;
      name: string;
      description: string | null;
      memberRole: ProjectMemberRole;
      createdAt: Date;
    }[]
  > {
    const members = await this.membersRepository.listByUser(userId);
    const projects = await this.projectsRepository.findByIds(
      members.map((member) => member.projectId),
    );
    const byId = new Map(projects.map((project) => [project.id, project]));
    return members
      .map((member) => {
        const project = byId.get(member.projectId);
        if (!project) {
          return null;
        }
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          memberRole: member.role,
          createdAt: project.createdAt,
        };
      })
      .filter(
        (
          item,
        ): item is {
          id: string;
          name: string;
          description: string | null;
          memberRole: ProjectMemberRole;
          createdAt: Date;
        } => item !== null,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async getMembershipOrThrow(userId: string, projectId: string) {
    const [project, membership] = await Promise.all([
      this.projectsRepository.findById(projectId),
      this.membersRepository.find(projectId, userId),
    ]);
    if (!project) {
      throw new NotFoundException('El proyecto no existe');
    }
    if (!membership) {
      throw new NotFoundException('No eres miembro de este proyecto');
    }
    return { project, membership };
  }

  async getProjectDetail(
    userId: string,
    projectId: string,
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    createdBy: string;
    memberRole: ProjectMemberRole;
    createdAt: Date;
  }> {
    const { project, membership } = await this.getMembershipOrThrow(
      userId,
      projectId,
    );
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      memberRole: membership.role,
      createdAt: project.createdAt,
    };
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const { membership } = await this.getMembershipOrThrow(userId, projectId);
    if (membership.role !== ProjectMemberRole.HOST) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este proyecto',
      );
    }
    await this.umlDiagramRepository.deleteDiagramDataByProject(projectId);
    await this.invitationsRepository.removeByProject(projectId);
    await this.membersRepository.removeByProject(projectId);
    await this.projectsRepository.remove(projectId);
    this.projectsGateway.emitProjectDeleted(projectId);
  }
}

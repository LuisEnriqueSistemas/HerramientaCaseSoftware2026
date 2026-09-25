import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { USERS_REPOSITORY } from '../users/repositories/users-repository.interface';
import type { UsersRepository } from '../users/repositories/users-repository.interface';
import {
  ProjectInvitation,
  ProjectInvitationStatus,
} from './entities/project-invitation.entity';
import { ProjectMemberRole } from './entities/project-member.entity';
import { PROJECT_INVITATIONS_REPOSITORY } from './repositories/project-invitations-repository.interface';
import type { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import { PROJECT_MEMBERS_REPOSITORY } from './repositories/project-members-repository.interface';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { PROJECTS_REPOSITORY } from './repositories/projects-repository.interface';
import type { ProjectsRepository } from './repositories/projects-repository.interface';

@Injectable()
export class InvitationsService {
  constructor(
    @Inject(PROJECT_INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: ProjectInvitationsRepository,
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly membersRepository: ProjectMembersRepository,
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  private async requireUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async listPending(userId: string): Promise<
    {
      id: string;
      projectId: string;
      projectName: string;
      email: string;
      role: ProjectMemberRole;
      status: ProjectInvitationStatus;
      createdAt: Date;
    }[]
  > {
    const user = await this.requireUser(userId);
    const invitations = await this.invitationsRepository.findPendingByEmail(
      user.email,
    );
    const projects = await this.projectsRepository.findByIds(
      invitations.map((invitation) => invitation.projectId),
    );
    const projectNames = new Map(
      projects.map((project) => [project.id, project.name]),
    );
    return invitations
      .filter((invitation) => projectNames.has(invitation.projectId))
      .map((invitation) => ({
        id: invitation.id,
        projectId: invitation.projectId,
        projectName: projectNames.get(invitation.projectId) as string,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
      }));
  }

  private async getPendingInvitation(
    userId: string,
    invitationId: string,
  ): Promise<{ user: User; invitation: ProjectInvitation }> {
    const user = await this.requireUser(userId);
    const invitation = await this.invitationsRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('La invitación no existe');
    }
    if (invitation.email !== user.email) {
      throw new ForbiddenException('Esta invitación no te corresponde a ti');
    }
    if (invitation.status !== ProjectInvitationStatus.PENDING) {
      throw new ConflictException(
        'La invitación ya fue procesada anteriormente',
      );
    }
    return { user, invitation };
  }

  async accept(userId: string, invitationId: string): Promise<void> {
    const { user, invitation } = await this.getPendingInvitation(
      userId,
      invitationId,
    );
    const existingMember = await this.membersRepository.find(
      invitation.projectId,
      user.id,
    );
    if (existingMember) {
      throw new ConflictException('Ya eres miembro de este proyecto');
    }
    await this.invitationsRepository.updateStatus(
      invitation.id,
      ProjectInvitationStatus.ACCEPTED,
    );
    await this.membersRepository.add(
      invitation.projectId,
      user.id,
      invitation.role,
    );
  }

  async reject(userId: string, invitationId: string): Promise<void> {
    const { invitation } = await this.getPendingInvitation(
      userId,
      invitationId,
    );
    await this.invitationsRepository.updateStatus(
      invitation.id,
      ProjectInvitationStatus.REJECTED,
    );
  }
}

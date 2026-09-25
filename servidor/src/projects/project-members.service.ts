import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USERS_REPOSITORY } from '../users/repositories/users-repository.interface';
import type { UsersRepository } from '../users/repositories/users-repository.interface';
import {
  ProjectMember,
  ProjectMemberRole,
} from './entities/project-member.entity';
import { PROJECT_MEMBERS_REPOSITORY } from './repositories/project-members-repository.interface';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { PROJECT_INVITATIONS_REPOSITORY } from './repositories/project-invitations-repository.interface';
import type { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import { PROJECTS_REPOSITORY } from './repositories/projects-repository.interface';
import type { ProjectsRepository } from './repositories/projects-repository.interface';
import { InviteRole } from './dto/invite-user.dto';
import { ProjectsGateway } from './projects.gateway';

const toMemberRole = (role: InviteRole): ProjectMemberRole =>
  role === InviteRole.EDITOR
    ? ProjectMemberRole.EDITOR
    : ProjectMemberRole.VIEWER;

@Injectable()
export class ProjectMembersService {
  constructor(
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly membersRepository: ProjectMembersRepository,
    @Inject(PROJECT_INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: ProjectInvitationsRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectsGateway: ProjectsGateway,
  ) {}

  private assertCanManage(
    membership: ProjectMember | null,
    action: string,
  ): asserts membership is ProjectMember {
    if (!membership) {
      throw new NotFoundException('No eres miembro de este proyecto');
    }
    if (membership.role !== ProjectMemberRole.HOST) {
      throw new ForbiddenException(`No tienes permiso para ${action}`);
    }
  }

  private async findMemberOrThrow(projectId: string, userId: string) {
    const membership = await this.membersRepository.find(projectId, userId);
    this.assertCanManage(membership, 'gestionar miembros');
    return membership;
  }

  async inviteUser(
    actorId: string,
    projectId: string,
    email: string,
    role: InviteRole,
  ): Promise<{
    id: string;
    projectId: string;
    email: string;
    role: ProjectMemberRole;
    createdAt: Date;
  }> {
    await this.findMemberOrThrow(projectId, actorId);
    const target = await this.usersRepository.findByEmail(email);
    if (!target) {
      throw new BadRequestException('El correo no está registrado');
    }
    if (target.id === actorId) {
      throw new ConflictException('No puedes invitarte a ti mismo');
    }
    const existingMember = await this.membersRepository.find(
      projectId,
      target.id,
    );
    if (existingMember) {
      throw new ConflictException('El usuario ya es miembro de este proyecto');
    }
    const existingInvitation =
      await this.invitationsRepository.findPendingByProjectAndEmail(
        projectId,
        email,
      );
    if (existingInvitation) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para este correo',
      );
    }
    const invitation = await this.invitationsRepository.createAndSave({
      projectId,
      invitedByUserId: actorId,
      email,
      role: toMemberRole(role),
    });
    return {
      id: invitation.id,
      projectId: invitation.projectId,
      email: invitation.email,
      role: invitation.role,
      createdAt: invitation.createdAt,
    };
  }

  async listMembers(
    actorId: string,
    projectId: string,
  ): Promise<
    { userId: string; name: string; email: string; role: ProjectMemberRole }[]
  > {
    const membership = await this.membersRepository.find(projectId, actorId);
    if (!membership) {
      throw new NotFoundException('No eres miembro de este proyecto');
    }
    if (
      membership.role !== ProjectMemberRole.HOST &&
      membership.role !== ProjectMemberRole.EDITOR
    ) {
      throw new ForbiddenException(
        'No tienes permiso para ver los miembros de este proyecto',
      );
    }
    const members = await this.membersRepository.listByProject(projectId);
    const users = await this.usersRepository.findManyByIds(
      members.map((member) => member.userId),
    );
    const byId = new Map(users.map((user) => [user.id, user]));
    const result: {
      userId: string;
      name: string;
      email: string;
      role: ProjectMemberRole;
    }[] = [];
    for (const member of members) {
      const user = byId.get(member.userId);
      if (user) {
        result.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: member.role,
        });
      }
    }
    return result;
  }

  async updateMemberRole(
    actorId: string,
    projectId: string,
    targetUserId: string,
    role: InviteRole,
  ): Promise<void> {
    await this.findMemberOrThrow(projectId, actorId);
    if (targetUserId === actorId) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }
    const targetMembership = await this.membersRepository.find(
      projectId,
      targetUserId,
    );
    if (!targetMembership) {
      throw new NotFoundException('El usuario no es miembro del proyecto');
    }
    if (targetMembership.role === ProjectMemberRole.HOST) {
      throw new ForbiddenException(
        'No puedes modificar el rol del propietario',
      );
    }
    await this.membersRepository.updateRole(
      projectId,
      targetUserId,
      toMemberRole(role),
    );
    this.projectsGateway.emitPermissionUpdate(
      projectId,
      targetUserId,
      toMemberRole(role),
    );
  }

  async removeMember(
    actorId: string,
    projectId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.findMemberOrThrow(projectId, actorId);
    if (targetUserId === actorId) {
      throw new BadRequestException('No puedes eliminarte a ti mismo');
    }
    const targetMembership = await this.membersRepository.find(
      projectId,
      targetUserId,
    );
    if (!targetMembership) {
      throw new NotFoundException('El usuario no es miembro del proyecto');
    }
    if (targetMembership.role === ProjectMemberRole.HOST) {
      throw new ForbiddenException('No puedes eliminar al propietario');
    }
    await this.membersRepository.remove(projectId, targetUserId);
    this.projectsGateway.emitUserRemoved(projectId, targetUserId);
  }
}

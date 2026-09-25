import type { UsersRepository } from '../users/repositories/users-repository.interface';
import { ProjectMemberRole } from './entities/project-member.entity';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import type { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import type { ProjectsRepository } from './repositories/projects-repository.interface';
import { InviteRole } from './dto/invite-user.dto';
import { ProjectsGateway } from './projects.gateway';
export declare class ProjectMembersService {
    private readonly membersRepository;
    private readonly invitationsRepository;
    private readonly usersRepository;
    private readonly projectsRepository;
    private readonly projectsGateway;
    constructor(membersRepository: ProjectMembersRepository, invitationsRepository: ProjectInvitationsRepository, usersRepository: UsersRepository, projectsRepository: ProjectsRepository, projectsGateway: ProjectsGateway);
    private assertCanManage;
    private findMemberOrThrow;
    inviteUser(actorId: string, projectId: string, email: string, role: InviteRole): Promise<{
        id: string;
        projectId: string;
        email: string;
        role: ProjectMemberRole;
        createdAt: Date;
    }>;
    listMembers(actorId: string, projectId: string): Promise<{
        userId: string;
        name: string;
        email: string;
        role: ProjectMemberRole;
    }[]>;
    updateMemberRole(actorId: string, projectId: string, targetUserId: string, role: InviteRole): Promise<void>;
    removeMember(actorId: string, projectId: string, targetUserId: string): Promise<void>;
}

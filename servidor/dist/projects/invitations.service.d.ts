import type { UsersRepository } from '../users/repositories/users-repository.interface';
import { ProjectInvitationStatus } from './entities/project-invitation.entity';
import { ProjectMemberRole } from './entities/project-member.entity';
import type { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import type { ProjectsRepository } from './repositories/projects-repository.interface';
export declare class InvitationsService {
    private readonly invitationsRepository;
    private readonly membersRepository;
    private readonly projectsRepository;
    private readonly usersRepository;
    constructor(invitationsRepository: ProjectInvitationsRepository, membersRepository: ProjectMembersRepository, projectsRepository: ProjectsRepository, usersRepository: UsersRepository);
    private requireUser;
    listPending(userId: string): Promise<{
        id: string;
        projectId: string;
        projectName: string;
        email: string;
        role: ProjectMemberRole;
        status: ProjectInvitationStatus;
        createdAt: Date;
    }[]>;
    private getPendingInvitation;
    accept(userId: string, invitationId: string): Promise<void>;
    reject(userId: string, invitationId: string): Promise<void>;
}

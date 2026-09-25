import type { UmlDiagramRepository } from '../uml/repositories/uml-diagram-repository.interface';
import { ProjectMemberRole } from './entities/project-member.entity';
import type { ProjectInvitationsRepository } from './repositories/project-invitations-repository.interface';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import type { ProjectsRepository } from './repositories/projects-repository.interface';
import { ProjectsGateway } from './projects.gateway';
export declare class ProjectsService {
    private readonly projectsRepository;
    private readonly membersRepository;
    private readonly invitationsRepository;
    private readonly umlDiagramRepository;
    private readonly projectsGateway;
    constructor(projectsRepository: ProjectsRepository, membersRepository: ProjectMembersRepository, invitationsRepository: ProjectInvitationsRepository, umlDiagramRepository: UmlDiagramRepository, projectsGateway: ProjectsGateway);
    createProject(userId: string, name: string, description: string | null): Promise<{
        id: string;
        name: string;
        description: string | null;
        role: ProjectMemberRole;
        createdAt: Date;
    }>;
    listProjectsForUser(userId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        memberRole: ProjectMemberRole;
        createdAt: Date;
    }[]>;
    private getMembershipOrThrow;
    getProjectDetail(userId: string, projectId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdBy: string;
        memberRole: ProjectMemberRole;
        createdAt: Date;
    }>;
    deleteProject(userId: string, projectId: string): Promise<void>;
}

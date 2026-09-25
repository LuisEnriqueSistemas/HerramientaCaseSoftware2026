import { Repository } from 'typeorm';
import { ProjectInvitation, ProjectInvitationStatus } from '../entities/project-invitation.entity';
import { InvitationCreationData, ProjectInvitationsRepository } from './project-invitations-repository.interface';
export declare class TypeOrmProjectInvitationsRepository implements ProjectInvitationsRepository {
    private readonly repository;
    constructor(repository: Repository<ProjectInvitation>);
    createAndSave(data: InvitationCreationData): Promise<ProjectInvitation>;
    findById(id: string): Promise<ProjectInvitation | null>;
    findPendingByEmail(email: string): Promise<ProjectInvitation[]>;
    findPendingByProjectAndEmail(projectId: string, email: string): Promise<ProjectInvitation | null>;
    updateStatus(id: string, status: ProjectInvitationStatus): Promise<ProjectInvitation | null>;
    removeByProject(projectId: string): Promise<void>;
}

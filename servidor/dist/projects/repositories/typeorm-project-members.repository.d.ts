import { Repository } from 'typeorm';
import { ProjectMember, ProjectMemberRole } from '../entities/project-member.entity';
import { ProjectMembersRepository } from './project-members-repository.interface';
export declare class TypeOrmProjectMembersRepository implements ProjectMembersRepository {
    private readonly repository;
    constructor(repository: Repository<ProjectMember>);
    add(projectId: string, userId: string, role: ProjectMemberRole): Promise<ProjectMember>;
    find(projectId: string, userId: string): Promise<ProjectMember | null>;
    listByProject(projectId: string): Promise<ProjectMember[]>;
    listByUser(userId: string): Promise<ProjectMember[]>;
    updateRole(projectId: string, userId: string, role: ProjectMemberRole): Promise<ProjectMember | null>;
    remove(projectId: string, userId: string): Promise<void>;
    removeByProject(projectId: string): Promise<void>;
}

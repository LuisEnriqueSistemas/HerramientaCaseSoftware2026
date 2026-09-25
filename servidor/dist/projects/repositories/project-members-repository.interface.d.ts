import { ProjectMember, ProjectMemberRole } from '../entities/project-member.entity';
export interface ProjectMembersRepository {
    add(projectId: string, userId: string, role: ProjectMemberRole): Promise<ProjectMember>;
    find(projectId: string, userId: string): Promise<ProjectMember | null>;
    listByProject(projectId: string): Promise<ProjectMember[]>;
    listByUser(userId: string): Promise<ProjectMember[]>;
    updateRole(projectId: string, userId: string, role: ProjectMemberRole): Promise<ProjectMember | null>;
    remove(projectId: string, userId: string): Promise<void>;
    removeByProject(projectId: string): Promise<void>;
}
export declare const PROJECT_MEMBERS_REPOSITORY: unique symbol;

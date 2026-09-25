import { ProjectMemberRole } from '../entities/project-member.entity';
export declare class ProjectResponseDto {
    id: string;
    name: string;
    description: string | null;
    role: ProjectMemberRole;
    createdAt: Date;
}
export declare class ProjectListItemDto {
    id: string;
    name: string;
    description: string | null;
    memberRole: ProjectMemberRole;
    createdAt: Date;
}
export declare class ProjectDetailDto {
    id: string;
    name: string;
    description: string | null;
    createdBy: string;
    memberRole: ProjectMemberRole;
    createdAt: Date;
}

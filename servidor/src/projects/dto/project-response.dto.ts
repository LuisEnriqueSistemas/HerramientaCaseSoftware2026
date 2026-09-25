import { ProjectMemberRole } from '../entities/project-member.entity';

export class ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  role: ProjectMemberRole;
  createdAt: Date;
}

export class ProjectListItemDto {
  id: string;
  name: string;
  description: string | null;
  memberRole: ProjectMemberRole;
  createdAt: Date;
}

export class ProjectDetailDto {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  memberRole: ProjectMemberRole;
  createdAt: Date;
}

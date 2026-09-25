import { ProjectMemberRole } from '../entities/project-member.entity';
import { ProjectInvitationStatus } from '../entities/project-invitation.entity';

export class InvitationResponseDto {
  id: string;
  projectId: string;
  projectName: string;
  email: string;
  role: ProjectMemberRole;
  status: ProjectInvitationStatus;
  createdAt: Date;
}

export class MemberResponseDto {
  userId: string;
  name: string;
  email: string;
  role: ProjectMemberRole;
}

import { ProjectMemberRole } from '../entities/project-member.entity';
import { ProjectInvitationStatus } from '../entities/project-invitation.entity';
export declare class InvitationResponseDto {
    id: string;
    projectId: string;
    projectName: string;
    email: string;
    role: ProjectMemberRole;
    status: ProjectInvitationStatus;
    createdAt: Date;
}
export declare class MemberResponseDto {
    userId: string;
    name: string;
    email: string;
    role: ProjectMemberRole;
}

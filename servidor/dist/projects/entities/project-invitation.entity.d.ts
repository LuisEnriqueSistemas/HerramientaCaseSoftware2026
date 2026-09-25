import { ProjectMemberRole } from './project-member.entity';
export declare enum ProjectInvitationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED"
}
export declare class ProjectInvitation {
    id: string;
    projectId: string;
    invitedByUserId: string;
    email: string;
    role: ProjectMemberRole;
    status: ProjectInvitationStatus;
    createdAt: Date;
    updatedAt: Date;
}

import {
  ProjectInvitation,
  ProjectInvitationStatus,
} from '../entities/project-invitation.entity';
import { ProjectMemberRole } from '../entities/project-member.entity';

export interface InvitationCreationData {
  projectId: string;
  invitedByUserId: string;
  email: string;
  role: ProjectMemberRole;
}

export interface ProjectInvitationsRepository {
  createAndSave(data: InvitationCreationData): Promise<ProjectInvitation>;
  findById(id: string): Promise<ProjectInvitation | null>;
  findPendingByEmail(email: string): Promise<ProjectInvitation[]>;
  findPendingByProjectAndEmail(
    projectId: string,
    email: string,
  ): Promise<ProjectInvitation | null>;
  updateStatus(
    id: string,
    status: ProjectInvitationStatus,
  ): Promise<ProjectInvitation | null>;
  removeByProject(projectId: string): Promise<void>;
}

export const PROJECT_INVITATIONS_REPOSITORY = Symbol(
  'PROJECT_INVITATIONS_REPOSITORY',
);

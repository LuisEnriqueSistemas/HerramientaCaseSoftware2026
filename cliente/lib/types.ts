export interface ApiUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiAuthResponse {
  access_token: string;
  user: ApiUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
}

export type ProjectMemberRole = "HOST" | "EDITOR" | "VIEWER";

export type InviteRole = "editor" | "viewer";

export interface ProjectCreated {
  id: string;
  name: string;
  description: string | null;
  role: ProjectMemberRole;
  createdAt: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  memberRole: ProjectMemberRole;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  memberRole: ProjectMemberRole;
  createdAt: string;
}

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: ProjectMemberRole;
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface InvitationCreated {
  id: string;
  projectId: string;
  email: string;
  role: ProjectMemberRole;
  createdAt: string;
}

export interface PendingInvitation {
  id: string;
  projectId: string;
  projectName: string;
  email: string;
  role: ProjectMemberRole;
  status: InvitationStatus;
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: InviteRole;
}
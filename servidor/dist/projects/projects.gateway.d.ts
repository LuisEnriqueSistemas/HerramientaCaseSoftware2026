import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProjectMemberRole } from './entities/project-member.entity';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
export declare const PROJECT_SOCKET_EVENTS: {
    readonly PROJECT_JOINED: "project_joined";
    readonly PERMISSIONS_UPDATED: "permissions_updated";
    readonly USER_REMOVED: "user_removed";
    readonly PROJECT_DELETED: "project_deleted";
};
export interface PermissionUpdatePayload {
    projectId: string;
    role: ProjectMemberRole;
}
export interface UserRemovedPayload {
    projectId: string;
}
export interface ProjectDeletedPayload {
    projectId: string;
}
export declare class ProjectsGateway implements OnGatewayConnection {
    private readonly jwtService;
    private readonly membersRepository;
    server: Server;
    constructor(jwtService: JwtService, membersRepository: ProjectMembersRepository);
    private getUserId;
    handleConnection(client: Socket): Promise<void>;
    handleJoinProject(client: Socket, projectId: unknown): Promise<{
        ok: boolean;
        projectId?: string;
    }>;
    handleLeaveProject(client: Socket, projectId: unknown): void;
    emitPermissionUpdate(projectId: string, targetUserId: string, newRole: ProjectMemberRole): void;
    emitUserRemoved(projectId: string, targetUserId: string): void;
    emitProjectDeleted(projectId: string): void;
}

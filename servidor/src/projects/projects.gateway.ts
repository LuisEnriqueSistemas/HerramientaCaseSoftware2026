import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ProjectMemberRole } from './entities/project-member.entity';
import { PROJECT_MEMBERS_REPOSITORY } from './repositories/project-members-repository.interface';
import type { ProjectMembersRepository } from './repositories/project-members-repository.interface';
import { getApplicationConfig } from '../config/application.config';

const clientUrl = getApplicationConfig().clientUrl;

const userRoom = (userId: string): string => `user:${userId}`;
const projectRoom = (projectId: string): string => `project:${projectId}`;

export const PROJECT_SOCKET_EVENTS = {
  PROJECT_JOINED: 'project_joined',
  PERMISSIONS_UPDATED: 'permissions_updated',
  USER_REMOVED: 'user_removed',
  PROJECT_DELETED: 'project_deleted',
} as const;

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

@WebSocketGateway({
  cors: { origin: clientUrl },
})
@Injectable()
export class ProjectsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly membersRepository: ProjectMembersRepository,
  ) {}

  private getUserId(client: Socket): string | null {
    return (client.data as { userId?: string }).userId ?? null;
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;
    if (typeof token !== 'string' || token.length === 0) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      (client.data as { userId: string }).userId = payload.sub;
      await client.join(userRoom(payload.sub));
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_project')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: unknown,
  ): Promise<{ ok: boolean; projectId?: string }> {
    const userId = this.getUserId(client);
    if (!userId) {
      return { ok: false };
    }
    if (typeof projectId !== 'string' || projectId.length === 0) {
      return { ok: false };
    }
    const membership = await this.membersRepository.find(projectId, userId);
    if (!membership) {
      return { ok: false };
    }
    await client.join(projectRoom(projectId));
    client.emit(PROJECT_SOCKET_EVENTS.PROJECT_JOINED, {
      ok: true,
      projectId,
      role: membership.role,
    });
    return { ok: true, projectId };
  }

  @SubscribeMessage('leave_project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: unknown,
  ): void {
    if (typeof projectId === 'string' && projectId.length > 0) {
      void client.leave(projectRoom(projectId));
    }
  }

  emitPermissionUpdate(
    projectId: string,
    targetUserId: string,
    newRole: ProjectMemberRole,
  ): void {
    const payload: PermissionUpdatePayload = { projectId, role: newRole };
    this.server
      .to(userRoom(targetUserId))
      .emit(PROJECT_SOCKET_EVENTS.PERMISSIONS_UPDATED, payload);
  }

  emitUserRemoved(projectId: string, targetUserId: string): void {
    const sockets = [...this.server.sockets.sockets.values()].filter(
      (socket) => (socket.data as { userId?: string }).userId === targetUserId,
    );
    const payload: UserRemovedPayload = { projectId };
    this.server
      .to(userRoom(targetUserId))
      .emit(PROJECT_SOCKET_EVENTS.USER_REMOVED, payload);
    for (const socket of sockets) {
      socket.disconnect(true);
    }
  }

  emitProjectDeleted(projectId: string): void {
    const room = projectRoom(projectId);
    const payload: ProjectDeletedPayload = { projectId };
    this.server.to(room).emit(PROJECT_SOCKET_EVENTS.PROJECT_DELETED, payload);
    for (const socket of this.server.sockets.sockets.values()) {
      if (socket.rooms.has(room)) {
        socket.disconnect(true);
      }
    }
  }
}

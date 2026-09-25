import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  UML_SOCKET_EVENTS,
  UmlNodeDeletedEvent,
  UmlNodeChangedEvent,
  UmlRelationChangedEvent,
  UmlRelationDeletedEvent,
  UmlDiagramTypeChangedEvent,
} from './interfaces/uml-operation.types';
import { UmlDiagramService } from './uml-diagram.service';
import { getApplicationConfig } from '../config/application.config';

const projectRoom = (projectId: string): string => `project:${projectId}`;
const clientUrl = getApplicationConfig().clientUrl;

export type UmlAck = { ok: true } | { ok: false; error: string };

@WebSocketGateway({
  namespace: '/',
  cors: { origin: clientUrl },
})
@Injectable()
export class UmlGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly umlDiagramService: UmlDiagramService) {}

  @SubscribeMessage(UML_SOCKET_EVENTS.DIAGRAM_TYPE_UPDATED)
  async handleDiagramTypeUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<UmlAck> {
    const userId = this.userIdOf(client);
    const result = await this.execute(userId, () =>
      this.umlDiagramService.applyDiagramType(userId as string, payload),
    );
    if (!this.isOk(result)) {
      return result;
    }
    const event: UmlDiagramTypeChangedEvent = result;
    this.server
      .to(projectRoom(result.projectId))
      .emit(UML_SOCKET_EVENTS.DIAGRAM_TYPE_UPDATED, event);
    return { ok: true };
  }

  emitDiagramGenerated(projectId: string, diagram: unknown): void {
    this.server
      .to(projectRoom(projectId))
      .emit(UML_SOCKET_EVENTS.DIAGRAM_GENERATED, { projectId, diagram });
  }

  private userIdOf(client: Socket): string | null {
    return (client.data as { userId?: string }).userId ?? null;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Operación no válida';
  }

  private async execute<T>(
    userId: string | null,
    operation: () => Promise<T>,
  ): Promise<T | UmlAck> {
    if (!userId) {
      return { ok: false, error: 'No autenticado' };
    }
    try {
      return await operation();
    } catch (error) {
      return { ok: false, error: this.errorMessage(error) };
    }
  }

  @SubscribeMessage(UML_SOCKET_EVENTS.NODE_ADDED)
  async handleNodeAdded(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<UmlAck> {
    const userId = this.userIdOf(client);
    const result = await this.execute(userId, () =>
      this.umlDiagramService.applyNodeAdded(userId as string, payload),
    );
    if (!this.isOk(result)) {
      return result;
    }
    const event: UmlNodeChangedEvent = {
      projectId: result.projectId,
      node: result.node,
      version: result.version,
    };
    this.server
      .to(projectRoom(result.projectId))
      .emit(UML_SOCKET_EVENTS.NODE_ADDED, event);
    return { ok: true };
  }

  @SubscribeMessage(UML_SOCKET_EVENTS.NODE_UPDATED)
  async handleNodeUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<UmlAck> {
    const userId = this.userIdOf(client);
    const result = await this.execute(userId, () =>
      this.umlDiagramService.applyNodeUpdated(userId as string, payload),
    );
    if (!this.isOk(result)) {
      return result;
    }
    const event: UmlNodeChangedEvent = {
      projectId: result.projectId,
      node: result.node,
      version: result.version,
    };
    this.server
      .to(projectRoom(result.projectId))
      .emit(UML_SOCKET_EVENTS.NODE_UPDATED, event);
    return { ok: true };
  }

  @SubscribeMessage(UML_SOCKET_EVENTS.NODE_DELETED)
  async handleNodeDeleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<UmlAck> {
    const userId = this.userIdOf(client);
    const result = await this.execute(userId, () =>
      this.umlDiagramService.applyNodeDeleted(userId as string, payload),
    );
    if (!this.isOk(result)) {
      return result;
    }
    const event: UmlNodeDeletedEvent = {
      projectId: result.projectId,
      nodeId: result.nodeId,
      deletedRelationIds: result.deletedRelationIds,
      version: result.version,
    };
    this.server
      .to(projectRoom(result.projectId))
      .emit(UML_SOCKET_EVENTS.NODE_DELETED, event);
    return { ok: true };
  }

  @SubscribeMessage(UML_SOCKET_EVENTS.RELATION_ADDED)
  async handleRelationAdded(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<UmlAck> {
    const userId = this.userIdOf(client);
    const result = await this.execute(userId, () =>
      this.umlDiagramService.applyRelationAdded(userId as string, payload),
    );
    if (!this.isOk(result)) {
      return result;
    }
    const event: UmlRelationChangedEvent = {
      projectId: result.projectId,
      edge: result.edge,
      version: result.version,
    };
    this.server
      .to(projectRoom(result.projectId))
      .emit(UML_SOCKET_EVENTS.RELATION_ADDED, event);
    return { ok: true };
  }

  @SubscribeMessage(UML_SOCKET_EVENTS.RELATION_UPDATED)
  async handleRelationUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<UmlAck> {
    const userId = this.userIdOf(client);
    const result = await this.execute(userId, () =>
      this.umlDiagramService.applyRelationUpdated(userId as string, payload),
    );
    if (!this.isOk(result)) {
      return result;
    }
    const event: UmlRelationChangedEvent = {
      projectId: result.projectId,
      edge: result.edge,
      version: result.version,
    };
    this.server
      .to(projectRoom(result.projectId))
      .emit(UML_SOCKET_EVENTS.RELATION_UPDATED, event);
    return { ok: true };
  }

  @SubscribeMessage(UML_SOCKET_EVENTS.RELATION_DELETED)
  async handleRelationDeleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<UmlAck> {
    const userId = this.userIdOf(client);
    const result = await this.execute(userId, () =>
      this.umlDiagramService.applyRelationDeleted(userId as string, payload),
    );
    if (!this.isOk(result)) {
      return result;
    }
    const event: UmlRelationDeletedEvent = {
      projectId: result.projectId,
      edgeId: result.edgeId,
      version: result.version,
    };
    this.server
      .to(projectRoom(result.projectId))
      .emit(UML_SOCKET_EVENTS.RELATION_DELETED, event);
    return { ok: true };
  }

  private isOk<T>(result: T | UmlAck): result is T {
    return (
      typeof result === 'object' &&
      result !== null &&
      !('ok' in result && result.ok === false)
    );
  }
}

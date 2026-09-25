import { Server, Socket } from 'socket.io';
import {
  UmlNodeDeletedEvent,
  UmlNodeChangedEvent,
  UmlRelationChangedEvent,
  UmlRelationDeletedEvent,
} from './interfaces/uml-operation.types';
import { UmlDiagramService } from './uml-diagram.service';
import { UmlGateway } from './uml.gateway';

const PROJECT_ID = 'a9f3b2c1-0000-4000-8000-000000000001';
const NODE_ID = 'a9f3b2c1-0000-4000-8000-000000000002';
const EDGE_ID = 'a9f3b2c1-0000-4000-8000-000000000004';

describe('UmlGateway', () => {
  let gateway: UmlGateway;
  const service = {
    applyNodeAdded: jest.fn(),
    applyNodeUpdated: jest.fn(),
    applyNodeDeleted: jest.fn(),
    applyRelationAdded: jest.fn(),
    applyRelationUpdated: jest.fn(),
    applyRelationDeleted: jest.fn(),
  } as unknown as jest.Mocked<UmlDiagramService>;

  const socketMock = {
    data: {} as Record<string, unknown>,
  } as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new UmlGateway(service);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;
    socketMock.data = { userId: 'user-1' };
  });

  const nodeResult = {
    projectId: PROJECT_ID,
    node: {
      id: NODE_ID,
      name: 'Usuario',
      x: 1,
      y: 2,
      attributes: [],
      methods: [],
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    version: 4,
  };

  it('rechaza operaciones sin sesión autenticada', async () => {
    socketMock.data = {};

    const result = await gateway.handleNodeAdded(socketMock, {
      projectId: PROJECT_ID,
      node: { id: NODE_ID, name: 'A', x: 0, y: 0 },
    });

    expect(service.applyNodeAdded).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: 'No autenticado' });
  });

  it('retransmite uml:node_added a la sala del proyecto y responde ok', async () => {
    service.applyNodeAdded.mockResolvedValue(nodeResult);

    const result = await gateway.handleNodeAdded(socketMock, {
      projectId: PROJECT_ID,
      node: { id: NODE_ID, name: 'Usuario', x: 1, y: 2 },
    });

    expect(gateway.server.to).toHaveBeenCalledWith(`project:${PROJECT_ID}`);
    const event: UmlNodeChangedEvent = {
      projectId: PROJECT_ID,
      node: nodeResult.node,
      version: 4,
    };
    expect(gateway.server.emit).toHaveBeenCalledWith('uml:node_added', event);
    expect(result).toEqual({ ok: true });
  });

  it('retransmite uml:node_updated con el nodo canónico', async () => {
    service.applyNodeUpdated.mockResolvedValue({
      ...nodeResult,
      node: { ...nodeResult.node, name: 'Cliente' },
    });

    const result = await gateway.handleNodeUpdated(socketMock, {
      projectId: PROJECT_ID,
      nodeId: NODE_ID,
      patch: { name: 'Cliente' },
    });

    expect(service.applyNodeUpdated).toHaveBeenCalledWith('user-1', {
      projectId: PROJECT_ID,
      nodeId: NODE_ID,
      patch: { name: 'Cliente' },
    });
    expect(gateway.server.emit).toHaveBeenCalledWith('uml:node_updated', {
      projectId: PROJECT_ID,
      node: { ...nodeResult.node, name: 'Cliente' },
      version: 4,
    });
    expect(result).toEqual({ ok: true });
  });

  it('retransmite uml:node_deleted con las relaciones eliminadas', async () => {
    service.applyNodeDeleted.mockResolvedValue({
      projectId: PROJECT_ID,
      nodeId: NODE_ID,
      deletedRelationIds: [EDGE_ID],
      version: 5,
    });

    const result = await gateway.handleNodeDeleted(socketMock, {
      projectId: PROJECT_ID,
      nodeId: NODE_ID,
    });

    const event: UmlNodeDeletedEvent = {
      projectId: PROJECT_ID,
      nodeId: NODE_ID,
      deletedRelationIds: [EDGE_ID],
      version: 5,
    };
    expect(gateway.server.emit).toHaveBeenCalledWith('uml:node_deleted', event);
    expect(result).toEqual({ ok: true });
  });

  it('retransmite uml:relation_added', async () => {
    service.applyRelationAdded.mockResolvedValue({
      projectId: PROJECT_ID,
      edge: {
        id: EDGE_ID,
        sourceId: NODE_ID,
        targetId: 'a9f3b2c1-0000-4000-8000-000000000003',
        type: 'ASSOCIATION',
        sourceMin: 1,
        sourceMax: 1,
        targetMin: 1,
        targetMax: 1,
        sourceRole: null,
        targetRole: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      version: 6,
    });

    const result = await gateway.handleRelationAdded(socketMock, {
      projectId: PROJECT_ID,
      edge: {
        id: EDGE_ID,
        sourceId: NODE_ID,
        targetId: 'a9f3b2c1-0000-4000-8000-000000000003',
        type: 'ASSOCIATION',
      },
    });

    const event: UmlRelationChangedEvent = {
      projectId: PROJECT_ID,
      edge: {
        id: EDGE_ID,
        sourceId: NODE_ID,
        targetId: 'a9f3b2c1-0000-4000-8000-000000000003',
        type: 'ASSOCIATION',
        sourceMin: 1,
        sourceMax: 1,
        targetMin: 1,
        targetMax: 1,
        sourceRole: null,
        targetRole: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      version: 6,
    };
    expect(gateway.server.emit).toHaveBeenCalledWith(
      'uml:relation_added',
      event,
    );
    expect(result).toEqual({ ok: true });
  });

  it('retransmite uml:relation_updated', async () => {
    service.applyRelationUpdated.mockResolvedValue({
      projectId: PROJECT_ID,
      edge: {
        id: EDGE_ID,
        sourceId: NODE_ID,
        targetId: 'a9f3b2c1-0000-4000-8000-000000000003',
        type: 'ASSOCIATION',
        sourceMin: 1,
        sourceMax: 1,
        targetMin: 0,
        targetMax: null,
        sourceRole: null,
        targetRole: 'órdenes',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      version: 6,
    });

    const result = await gateway.handleRelationUpdated(socketMock, {
      projectId: PROJECT_ID,
      edgeId: EDGE_ID,
      patch: { targetMin: 0, targetMax: null, targetRole: 'órdenes' },
    });

    const event: UmlRelationChangedEvent = {
      projectId: PROJECT_ID,
      edge: {
        id: EDGE_ID,
        sourceId: NODE_ID,
        targetId: 'a9f3b2c1-0000-4000-8000-000000000003',
        type: 'ASSOCIATION',
        sourceMin: 1,
        sourceMax: 1,
        targetMin: 0,
        targetMax: null,
        sourceRole: null,
        targetRole: 'órdenes',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      version: 6,
    };
    expect(gateway.server.emit).toHaveBeenCalledWith(
      'uml:relation_updated',
      event,
    );
    expect(result).toEqual({ ok: true });
  });

  it('retransmite uml:relation_deleted', async () => {
    service.applyRelationDeleted.mockResolvedValue({
      projectId: PROJECT_ID,
      edgeId: EDGE_ID,
      version: 7,
    });

    const result = await gateway.handleRelationDeleted(socketMock, {
      projectId: PROJECT_ID,
      edgeId: EDGE_ID,
    });

    const event: UmlRelationDeletedEvent = {
      projectId: PROJECT_ID,
      edgeId: EDGE_ID,
      version: 7,
    };
    expect(gateway.server.emit).toHaveBeenCalledWith(
      'uml:relation_deleted',
      event,
    );
    expect(result).toEqual({ ok: true });
  });

  it('responde {ok:false} con el mensaje de error y no retransmite', async () => {
    service.applyNodeAdded.mockRejectedValue(
      new Error('No tienes permisos de edición en este diagrama'),
    );

    const result = await gateway.handleNodeAdded(socketMock, {
      projectId: PROJECT_ID,
      node: { id: NODE_ID, name: 'A', x: 0, y: 0 },
    });

    expect(gateway.server.emit).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'No tienes permisos de edición en este diagrama',
    });
  });
});

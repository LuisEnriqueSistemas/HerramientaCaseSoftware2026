import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMemberRole } from '../projects/entities/project-member.entity';
import type { ProjectMembersRepository } from '../projects/repositories/project-members-repository.interface';
import { UmlClassNode } from './entities/uml-class-node.entity';
import { UmlDiagram } from './entities/uml-diagram.entity';
import { UmlDiagramModelType } from './entities/uml-diagram.entity';
import { UmlRelation } from './entities/uml-relation.entity';
import type { UmlDiagramRepository } from './repositories/uml-diagram-repository.interface';
import { UmlDiagramService } from './uml-diagram.service';

const PROJECT_ID = 'a9f3b2c1-0000-4000-8000-000000000001';
const NODE_ID = 'a9f3b2c1-0000-4000-8000-000000000002';
const OTHER_ID = 'a9f3b2c1-0000-4000-8000-000000000003';
const EDGE_ID = 'a9f3b2c1-0000-4000-8000-000000000004';

const diagram = (version = 3) =>
  ({
    id: 'diagram-1',
    projectId: PROJECT_ID,
    version,
  }) as UmlDiagram;

const classNode = (overrides: Partial<UmlClassNode> = {}) => ({
  id: NODE_ID,
  diagramId: 'diagram-1',
  name: 'Usuario',
  positionX: 100,
  positionY: 200,
  attributes: [],
  methods: [],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const relation = (overrides: Partial<UmlRelation> = {}) =>
  ({
    id: EDGE_ID,
    diagramId: 'diagram-1',
    sourceNodeId: NODE_ID,
    targetNodeId: OTHER_ID,
    type: 'ASSOCIATION',
    sourceMin: 1,
    sourceMax: 1,
    targetMin: 1,
    targetMax: 1,
    sourceRole: null,
    targetRole: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as UmlRelation;

describe('UmlDiagramService', () => {
  let service: UmlDiagramService;
  const membersRepository = {
    find: jest.fn(),
  } as unknown as jest.Mocked<ProjectMembersRepository>;
  const diagramRepository = {
    findOrCreateForProject: jest.fn(),
    saveDiagram: jest.fn(),
    listClasses: jest.fn(),
    listRelations: jest.fn(),
    findClassById: jest.fn(),
    findRelationById: jest.fn(),
    saveClass: jest.fn(),
    saveRelation: jest.fn(),
    deleteNode: jest.fn(),
    deleteRelation: jest.fn(),
    deleteRelationsFromNode: jest.fn(),
  } as unknown as jest.Mocked<UmlDiagramRepository>;

  const member = (role: ProjectMemberRole) => ({ role });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UmlDiagramService(membersRepository, diagramRepository);
  });

  describe('getDiagram', () => {
    it('rechaza un projectId inválido', async () => {
      await expect(
        service.getDiagram('user-1', 'no-valid-uuid'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza NotFound cuando el usuario no es miembro', async () => {
      membersRepository.find.mockResolvedValue(null);

      await expect(
        service.getDiagram('user-1', PROJECT_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('devuelve el diagrama con canEdit según el rol', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.listClasses.mockResolvedValue([classNode()]);
      diagramRepository.listRelations.mockResolvedValue([relation()]);

      const result = await service.getDiagram('user-1', PROJECT_ID);

      expect(result.canEdit).toBe(true);
      expect(result.version).toBe(3);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        id: NODE_ID,
        name: 'Usuario',
        x: 100,
        y: 200,
      });
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toMatchObject({
        id: EDGE_ID,
        sourceId: NODE_ID,
        targetId: OTHER_ID,
        type: 'ASSOCIATION',
      });
    });

    it('marca canEdit=false para un VIEWER', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.VIEWER),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.listClasses.mockResolvedValue([]);
      diagramRepository.listRelations.mockResolvedValue([]);

      const result = await service.getDiagram('user-1', PROJECT_ID);

      expect(result.canEdit).toBe(false);
    });
  });

  describe('modo ER lógico', () => {
    it('cambia el modo del diagrama y aumenta la versión', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      const current = diagram(2);
      diagramRepository.findOrCreateForProject.mockResolvedValue(current);
      diagramRepository.saveDiagram.mockResolvedValue({
        ...current,
        modelType: UmlDiagramModelType.ER_LOGICAL,
        version: 3,
      });

      const result = await service.applyDiagramType('user-1', {
        projectId: PROJECT_ID,
        modelType: UmlDiagramModelType.ER_LOGICAL,
      });

      expect(result.modelType).toBe(UmlDiagramModelType.ER_LOGICAL);
      expect(result.version).toBe(3);
      expect(diagramRepository.saveDiagram).toHaveBeenCalled();
    });

    it('rechaza dos PK individuales en una entidad ER', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue({
        ...diagram(),
        modelType: UmlDiagramModelType.ER_LOGICAL,
      });
      diagramRepository.findClassById.mockResolvedValue(classNode());

      await expect(
        service.applyNodeUpdated('user-1', {
          projectId: PROJECT_ID,
          nodeId: NODE_ID,
          patch: {
            attributes: [
              { visibility: 'private', name: 'a', type: 'INT', keyType: 'PK' },
              { visibility: 'private', name: 'b', type: 'INT', keyType: 'PK' },
            ],
          },
        }),
      ).rejects.toThrow('clave compuesta');
    });
  });

  describe('permisos de escritura', () => {
    it.each(['applyNodeAdded', 'applyRelationAdded'] as const)(
      '%s lanza Forbidden para VIEWER',
      async (method) => {
        membersRepository.find.mockResolvedValue(
          member(ProjectMemberRole.VIEWER),
        );
        const payload =
          method === 'applyNodeAdded'
            ? {
                projectId: PROJECT_ID,
                node: { id: NODE_ID, name: 'A', x: 0, y: 0 },
              }
            : {
                projectId: PROJECT_ID,
                edge: {
                  id: EDGE_ID,
                  sourceId: NODE_ID,
                  targetId: OTHER_ID,
                  type: 'ASSOCIATION',
                },
              };

        await expect(service[method]('user-1', payload)).rejects.toBeInstanceOf(
          ForbiddenException,
        );
      },
    );

    it('lanza Forbidden para nodo actualizado por VIEWER', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.VIEWER),
      );

      await expect(
        service.applyNodeUpdated('user-1', {
          projectId: PROJECT_ID,
          nodeId: NODE_ID,
          patch: { name: 'X' },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza Forbidden para nodo eliminado por VIEWER', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.VIEWER),
      );

      await expect(
        service.applyNodeDeleted('user-1', {
          projectId: PROJECT_ID,
          nodeId: NODE_ID,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza Forbidden para relación eliminada por VIEWER', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.VIEWER),
      );

      await expect(
        service.applyRelationDeleted('user-1', {
          projectId: PROJECT_ID,
          edgeId: EDGE_ID,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('applyNodeAdded', () => {
    it('rechaza un payload no válido', async () => {
      await expect(
        service.applyNodeAdded('user-1', null),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('crea el nodo e incrementa la versión', async () => {
      membersRepository.find.mockResolvedValue(member(ProjectMemberRole.HOST));
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(2));
      diagramRepository.findClassById.mockResolvedValue(null);
      diagramRepository.saveClass.mockResolvedValue(classNode());
      diagramRepository.saveDiagram.mockResolvedValue(diagram(3));

      const result = await service.applyNodeAdded('user-1', {
        projectId: PROJECT_ID,
        node: {
          id: NODE_ID,
          name: 'Usuario',
          x: 10,
          y: 20,
          attributes: [
            { visibility: 'private', name: 'id', type: 'INT', keyType: 'PK' },
          ],
        },
      });

      expect(diagramRepository.saveClass).toHaveBeenCalledWith(
        expect.objectContaining({
          id: NODE_ID,
          diagramId: 'diagram-1',
          name: 'Usuario',
          positionX: 10,
          positionY: 20,
        }),
      );
      expect(diagramRepository.saveDiagram).toHaveBeenCalledWith({
        id: 'diagram-1',
        projectId: PROJECT_ID,
        version: 3,
      });
      expect(result.version).toBe(3);
      expect(result.node.id).toBe(NODE_ID);
    });

    it('rechaza nodos duplicados', async () => {
      membersRepository.find.mockResolvedValue(member(ProjectMemberRole.HOST));
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.findClassById.mockResolvedValue(classNode());

      await expect(
        service.applyNodeAdded('user-1', {
          projectId: PROJECT_ID,
          node: { id: NODE_ID, name: 'Usuario', x: 0, y: 0 },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('applyNodeUpdated', () => {
    it('actualiza parcialmente el nodo', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(1));
      diagramRepository.findClassById.mockResolvedValue(classNode());
      diagramRepository.saveClass.mockResolvedValue(
        classNode({ name: 'Cliente', positionX: 300 }),
      );
      diagramRepository.saveDiagram.mockResolvedValue(diagram(2));

      const result = await service.applyNodeUpdated('user-1', {
        projectId: PROJECT_ID,
        nodeId: NODE_ID,
        patch: { name: 'Cliente', x: 300 },
      });

      expect(result.node.name).toBe('Cliente');
      expect(result.node.x).toBe(300);
      expect(result.version).toBe(2);
    });

    it('lanza NotFound si el nodo no existe', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.findClassById.mockResolvedValue(null);

      await expect(
        service.applyNodeUpdated('user-1', {
          projectId: PROJECT_ID,
          nodeId: NODE_ID,
          patch: { name: 'X' },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza NotFound si el nodo pertenece a otro diagrama', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.findClassById.mockResolvedValue(
        classNode({ diagramId: 'otro-diagrama' }),
      );

      await expect(
        service.applyNodeUpdated('user-1', {
          projectId: PROJECT_ID,
          nodeId: NODE_ID,
          patch: { name: 'X' },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('applyNodeDeleted', () => {
    it('elimina el nodo y sus relaciones', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(4));
      diagramRepository.findClassById.mockResolvedValue(classNode());
      diagramRepository.deleteRelationsFromNode.mockResolvedValue([relation()]);
      diagramRepository.deleteNode.mockResolvedValue(undefined);
      diagramRepository.saveDiagram.mockResolvedValue(diagram(5));

      const result = await service.applyNodeDeleted('user-1', {
        projectId: PROJECT_ID,
        nodeId: NODE_ID,
      });

      expect(diagramRepository.deleteRelationsFromNode).toHaveBeenCalledWith(
        'diagram-1',
        NODE_ID,
      );
      expect(diagramRepository.deleteNode).toHaveBeenCalledWith(
        'diagram-1',
        NODE_ID,
      );
      expect(result.deletedRelationIds).toEqual([EDGE_ID]);
      expect(result.version).toBe(5);
    });
  });

  describe('applyRelationAdded', () => {
    it('crea la relación cuando ambos nodos existen', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(1));
      diagramRepository.findClassById.mockImplementation((id: string) =>
        Promise.resolve(classNode(id === NODE_ID ? {} : { id: OTHER_ID })),
      );
      diagramRepository.findRelationById.mockResolvedValue(null);
      diagramRepository.saveRelation.mockResolvedValue(
        relation({ type: 'INHERITANCE' }),
      );
      diagramRepository.saveDiagram.mockResolvedValue(diagram(2));

      const result = await service.applyRelationAdded('user-1', {
        projectId: PROJECT_ID,
        edge: {
          id: EDGE_ID,
          sourceId: NODE_ID,
          targetId: OTHER_ID,
          type: 'INHERITANCE',
        },
      });

      expect(result.edge.type).toBe('INHERITANCE');
      expect(result.version).toBe(2);
    });

    it('aplica multiplicidad 1..1 y roles nulos por defecto', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(1));
      diagramRepository.findClassById.mockImplementation((id: string) =>
        Promise.resolve(classNode(id === NODE_ID ? {} : { id: OTHER_ID })),
      );
      diagramRepository.findRelationById.mockResolvedValue(null);
      diagramRepository.saveRelation.mockResolvedValue(
        relation({ type: 'ASSOCIATION' }),
      );
      diagramRepository.saveDiagram.mockResolvedValue(diagram(2));

      await service.applyRelationAdded('user-1', {
        projectId: PROJECT_ID,
        edge: {
          id: EDGE_ID,
          sourceId: NODE_ID,
          targetId: OTHER_ID,
          type: 'ASSOCIATION',
        },
      });

      expect(diagramRepository.saveRelation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: EDGE_ID,
          type: 'ASSOCIATION',
          sourceMin: 1,
          sourceMax: 1,
          targetMin: 1,
          targetMax: 1,
          sourceRole: null,
          targetRole: null,
        }),
      );
    });

    it.each(['COMPOSITION', 'DEPENDENCY'] as const)(
      'acepta el tipo de relación %s',
      async (type) => {
        membersRepository.find.mockResolvedValue(
          member(ProjectMemberRole.EDITOR),
        );
        diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(1));
        diagramRepository.findClassById.mockImplementation((id: string) =>
          Promise.resolve(classNode(id === NODE_ID ? {} : { id: OTHER_ID })),
        );
        diagramRepository.findRelationById.mockResolvedValue(null);
        diagramRepository.saveRelation.mockResolvedValue(relation({ type }));
        diagramRepository.saveDiagram.mockResolvedValue(diagram(2));

        const result = await service.applyRelationAdded('user-1', {
          projectId: PROJECT_ID,
          edge: {
            id: EDGE_ID,
            sourceId: NODE_ID,
            targetId: OTHER_ID,
            type,
          },
        });

        expect(result.edge.type).toBe(type);
      },
    );

    it('persiste multiplicidad y roles provistos', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(1));
      diagramRepository.findClassById.mockImplementation((id: string) =>
        Promise.resolve(classNode(id === NODE_ID ? {} : { id: OTHER_ID })),
      );
      diagramRepository.findRelationById.mockResolvedValue(null);
      diagramRepository.saveRelation.mockResolvedValue(
        relation({
          type: 'COMPOSITION',
          sourceMin: 1,
          sourceMax: 1,
          targetMin: 0,
          targetMax: null,
          targetRole: 'partes',
        }),
      );
      diagramRepository.saveDiagram.mockResolvedValue(diagram(2));

      const result = await service.applyRelationAdded('user-1', {
        projectId: PROJECT_ID,
        edge: {
          id: EDGE_ID,
          sourceId: NODE_ID,
          targetId: OTHER_ID,
          type: 'COMPOSITION',
          sourceMin: 1,
          sourceMax: 1,
          targetMin: 0,
          targetMax: null,
          targetRole: 'partes',
        },
      });

      expect(diagramRepository.saveRelation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'COMPOSITION',
          sourceMin: 1,
          sourceMax: 1,
          targetMin: 0,
          targetMax: null,
          targetRole: 'partes',
        }),
      );
      expect(result.edge.targetMin).toBe(0);
      expect(result.edge.targetMax).toBeNull();
      expect(result.edge.targetRole).toBe('partes');
    });

    it('rechaza multiplicidad con máximo menor al mínimo', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );

      await expect(
        service.applyRelationAdded('user-1', {
          projectId: PROJECT_ID,
          edge: {
            id: EDGE_ID,
            sourceId: NODE_ID,
            targetId: OTHER_ID,
            type: 'ASSOCIATION',
            sourceMin: 2,
            sourceMax: 1,
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza una multiplicidad no entera', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );

      await expect(
        service.applyRelationAdded('user-1', {
          projectId: PROJECT_ID,
          edge: {
            id: EDGE_ID,
            sourceId: NODE_ID,
            targetId: OTHER_ID,
            type: 'ASSOCIATION',
            targetMin: 1.5,
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un rol de más de 64 caracteres', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );

      await expect(
        service.applyRelationAdded('user-1', {
          projectId: PROJECT_ID,
          edge: {
            id: EDGE_ID,
            sourceId: NODE_ID,
            targetId: OTHER_ID,
            type: 'ASSOCIATION',
            targetRole: 'r'.repeat(65),
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza si el nodo origen no existe', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.findClassById.mockResolvedValue(null);

      await expect(
        service.applyRelationAdded('user-1', {
          projectId: PROJECT_ID,
          edge: {
            id: EDGE_ID,
            sourceId: NODE_ID,
            targetId: OTHER_ID,
            type: 'ASSOCIATION',
          },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza un tipo de relación inválido', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );

      await expect(
        service.applyRelationAdded('user-1', {
          projectId: PROJECT_ID,
          edge: {
            id: EDGE_ID,
            sourceId: NODE_ID,
            targetId: OTHER_ID,
            type: 'BOGUS',
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('applyRelationUpdated', () => {
    it('actualiza multiplicidad y roles de forma parcial', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(2));
      diagramRepository.findRelationById.mockResolvedValue(
        relation({ targetMin: 1, targetMax: 1, targetRole: null }),
      );
      diagramRepository.saveRelation.mockResolvedValue(
        relation({ targetMin: 0, targetMax: null, targetRole: 'órdenes' }),
      );
      diagramRepository.saveDiagram.mockResolvedValue(diagram(3));

      const result = await service.applyRelationUpdated('user-1', {
        projectId: PROJECT_ID,
        edgeId: EDGE_ID,
        patch: { targetMin: 0, targetMax: null, targetRole: 'órdenes' },
      });

      expect(diagramRepository.saveRelation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: EDGE_ID,
          type: 'ASSOCIATION',
          targetMin: 0,
          targetMax: null,
          targetRole: 'órdenes',
        }),
      );
      expect(result.edge.targetMin).toBe(0);
      expect(result.edge.targetMax).toBeNull();
      expect(result.edge.targetRole).toBe('órdenes');
      expect(result.version).toBe(3);
    });

    it('actualiza el tipo de relación', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(2));
      diagramRepository.findRelationById.mockResolvedValue(relation());
      diagramRepository.saveRelation.mockResolvedValue(
        relation({ type: 'COMPOSITION' }),
      );
      diagramRepository.saveDiagram.mockResolvedValue(diagram(3));

      const result = await service.applyRelationUpdated('user-1', {
        projectId: PROJECT_ID,
        edgeId: EDGE_ID,
        patch: { type: 'COMPOSITION' },
      });

      expect(diagramRepository.saveRelation).toHaveBeenCalledWith(
        expect.objectContaining({ id: EDGE_ID, type: 'COMPOSITION' }),
      );
      expect(result.edge.type).toBe('COMPOSITION');
    });

    it('lanza NotFound si la relación no existe', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.findRelationById.mockResolvedValue(null);

      await expect(
        service.applyRelationUpdated('user-1', {
          projectId: PROJECT_ID,
          edgeId: EDGE_ID,
          patch: { targetMax: null },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza multiplicidad con máximo menor al mínimo', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );

      await expect(
        service.applyRelationUpdated('user-1', {
          projectId: PROJECT_ID,
          edgeId: EDGE_ID,
          patch: { sourceMin: 3, sourceMax: 1 },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un tipo de relación inválido', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );

      await expect(
        service.applyRelationUpdated('user-1', {
          projectId: PROJECT_ID,
          edgeId: EDGE_ID,
          patch: { type: 'BOGUS' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('applyRelationDeleted', () => {
    it('elimina la relación del diagrama', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram(2));
      diagramRepository.findRelationById.mockResolvedValue(relation());
      diagramRepository.deleteRelation.mockResolvedValue(undefined);
      diagramRepository.saveDiagram.mockResolvedValue(diagram(3));

      const result = await service.applyRelationDeleted('user-1', {
        projectId: PROJECT_ID,
        edgeId: EDGE_ID,
      });

      expect(diagramRepository.deleteRelation).toHaveBeenCalledWith(
        'diagram-1',
        EDGE_ID,
      );
      expect(result.edgeId).toBe(EDGE_ID);
      expect(result.version).toBe(3);
    });

    it('lanza NotFound si la relación no existe', async () => {
      membersRepository.find.mockResolvedValue(
        member(ProjectMemberRole.EDITOR),
      );
      diagramRepository.findOrCreateForProject.mockResolvedValue(diagram());
      diagramRepository.findRelationById.mockResolvedValue(null);

      await expect(
        service.applyRelationDeleted('user-1', {
          projectId: PROJECT_ID,
          edgeId: EDGE_ID,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

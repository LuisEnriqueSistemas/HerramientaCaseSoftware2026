import { Repository } from 'typeorm';
import { UmlClassNode } from '../entities/uml-class-node.entity';
import { UmlDiagram } from '../entities/uml-diagram.entity';
import { UmlRelation } from '../entities/uml-relation.entity';
import { TypeOrmUmlDiagramRepository } from './typeorm-uml-diagram.repository';

describe('TypeOrmUmlDiagramRepository', () => {
  let repository: TypeOrmUmlDiagramRepository;
  const diagramsRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<UmlDiagram>>;
  const classesRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<UmlClassNode>>;
  const relationsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<UmlRelation>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TypeOrmUmlDiagramRepository(
      diagramsRepo,
      classesRepo,
      relationsRepo,
    );
  });

  describe('findOrCreateForProject', () => {
    it('devuelve el diagrama existente del proyecto', async () => {
      const diagram = { id: 'diagram-1', projectId: 'project-1' } as UmlDiagram;
      (diagramsRepo.findOne as jest.Mock).mockResolvedValue(diagram);

      const result = await repository.findOrCreateForProject('project-1');

      expect(diagramsRepo.findOne).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
      });
      expect(diagramsRepo.create).not.toHaveBeenCalled();
      expect(result).toBe(diagram);
    });

    it('crea y guarda el diagrama cuando no existe', async () => {
      (diagramsRepo.findOne as jest.Mock).mockResolvedValue(null);
      const created = { id: 'diagram-2', projectId: 'project-2' } as UmlDiagram;
      (diagramsRepo.create as jest.Mock).mockReturnValue(created);
      (diagramsRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await repository.findOrCreateForProject('project-2');

      expect(diagramsRepo.create).toHaveBeenCalledWith({
        projectId: 'project-2',
      });
      expect(diagramsRepo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });
  });

  describe('saveClass / saveRelation', () => {
    it('persiste una clase UML', async () => {
      const node = { id: 'node-1' } as UmlClassNode;
      (classesRepo.save as jest.Mock).mockResolvedValue(node);

      const result = await repository.saveClass(node);

      expect(classesRepo.save).toHaveBeenCalledWith(node);
      expect(result).toBe(node);
    });

    it('persiste una relación UML', async () => {
      const relation = { id: 'edge-1' } as UmlRelation;
      (relationsRepo.save as jest.Mock).mockResolvedValue(relation);

      const result = await repository.saveRelation(relation);

      expect(relationsRepo.save).toHaveBeenCalledWith(relation);
      expect(result).toBe(relation);
    });
  });

  describe('deleteRelationsFromNode', () => {
    it('elimina las relaciones que referencian al nodo y las devuelve', async () => {
      const relations = [{ id: 'edge-1' }, { id: 'edge-2' }] as UmlRelation[];
      (relationsRepo.find as jest.Mock).mockResolvedValue(relations);

      const result = await repository.deleteRelationsFromNode(
        'diagram-1',
        'node-1',
      );

      expect(relationsRepo.find).toHaveBeenCalledWith({
        where: [
          { diagramId: 'diagram-1', sourceNodeId: 'node-1' },
          { diagramId: 'diagram-1', targetNodeId: 'node-1' },
        ],
      });
      expect(relationsRepo.delete).toHaveBeenCalledTimes(1);
      const deleteCriteria = relationsRepo.delete.mock.calls[0][0] as {
        diagramId: string;
        id: { value: string[] };
      };
      expect(deleteCriteria.diagramId).toBe('diagram-1');
      expect(deleteCriteria.id.value).toEqual(['edge-1', 'edge-2']);
      expect(result).toBe(relations);
    });

    it('no elimina nada cuando no hay relaciones', async () => {
      (relationsRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.deleteRelationsFromNode(
        'diagram-1',
        'node-1',
      );

      expect(relationsRepo.delete).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('deleteRelation', () => {
    it('elimina la relación del diagrama', async () => {
      await repository.deleteRelation('diagram-1', 'edge-1');

      expect(relationsRepo.delete).toHaveBeenCalledWith({
        id: 'edge-1',
        diagramId: 'diagram-1',
      });
    });
  });

  describe('deleteNode', () => {
    it('elimina la clase del diagrama', async () => {
      await repository.deleteNode('diagram-1', 'node-1');

      expect(classesRepo.delete).toHaveBeenCalledWith({
        id: 'node-1',
        diagramId: 'diagram-1',
      });
    });
  });

  describe('deleteDiagramDataByProject', () => {
    it('elimina relaciones, clases y el diagrama del proyecto', async () => {
      const diagram = { id: 'diagram-1', projectId: 'project-1' } as UmlDiagram;
      (diagramsRepo.findOne as jest.Mock).mockResolvedValue(diagram);

      await repository.deleteDiagramDataByProject('project-1');

      expect(diagramsRepo.findOne).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
      });
      expect(relationsRepo.delete).toHaveBeenCalledWith({
        diagramId: 'diagram-1',
      });
      expect(classesRepo.delete).toHaveBeenCalledWith({
        diagramId: 'diagram-1',
      });
      expect(diagramsRepo.delete).toHaveBeenCalledWith('diagram-1');
    });

    it('no elimina nada cuando el proyecto no tiene diagrama', async () => {
      (diagramsRepo.findOne as jest.Mock).mockResolvedValue(null);

      await repository.deleteDiagramDataByProject('project-1');

      expect(relationsRepo.delete).not.toHaveBeenCalled();
      expect(classesRepo.delete).not.toHaveBeenCalled();
      expect(diagramsRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('listClasses / listRelations', () => {
    it('lista las clases de un diagrama', async () => {
      const nodes = [{ id: 'node-1' }] as UmlClassNode[];
      (classesRepo.find as jest.Mock).mockResolvedValue(nodes);

      const result = await repository.listClasses('diagram-1');

      expect(classesRepo.find).toHaveBeenCalledWith({
        where: { diagramId: 'diagram-1' },
      });
      expect(result).toBe(nodes);
    });

    it('lista las relaciones de un diagrama', async () => {
      const relations = [{ id: 'edge-1' }] as UmlRelation[];
      (relationsRepo.find as jest.Mock).mockResolvedValue(relations);

      const result = await repository.listRelations('diagram-1');

      expect(relationsRepo.find).toHaveBeenCalledWith({
        where: { diagramId: 'diagram-1' },
      });
      expect(result).toBe(relations);
    });
  });

  describe('findClassById / findRelationById', () => {
    it('busca una clase por id', async () => {
      const node = { id: 'node-1' } as UmlClassNode;
      (classesRepo.findOne as jest.Mock).mockResolvedValue(node);

      const result = await repository.findClassById('node-1');

      expect(classesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'node-1' },
      });
      expect(result).toBe(node);
    });

    it('busca una relación por id', async () => {
      const relation = { id: 'edge-1' } as UmlRelation;
      (relationsRepo.findOne as jest.Mock).mockResolvedValue(relation);

      const result = await repository.findRelationById('edge-1');

      expect(relationsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'edge-1' },
      });
      expect(result).toBe(relation);
    });
  });

  describe('saveDiagram', () => {
    it('persiste el diagrama (versión)', async () => {
      const diagram = { id: 'diagram-1', version: 2 } as UmlDiagram;
      (diagramsRepo.save as jest.Mock).mockResolvedValue(diagram);

      const result = await repository.saveDiagram(diagram);

      expect(diagramsRepo.save).toHaveBeenCalledWith(diagram);
      expect(result).toBe(diagram);
    });
  });
});

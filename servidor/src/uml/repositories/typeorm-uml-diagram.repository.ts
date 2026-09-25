import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UmlClassNode } from '../entities/uml-class-node.entity';
import { UmlDiagram } from '../entities/uml-diagram.entity';
import { UmlRelation } from '../entities/uml-relation.entity';
import { UmlDiagramRepository } from './uml-diagram-repository.interface';

@Injectable()
export class TypeOrmUmlDiagramRepository implements UmlDiagramRepository {
  constructor(
    @InjectRepository(UmlDiagram)
    private readonly diagramsRepository: Repository<UmlDiagram>,
    @InjectRepository(UmlClassNode)
    private readonly classesRepository: Repository<UmlClassNode>,
    @InjectRepository(UmlRelation)
    private readonly relationsRepository: Repository<UmlRelation>,
  ) {}

  async findOrCreateForProject(projectId: string): Promise<UmlDiagram> {
    const existing = await this.diagramsRepository.findOne({
      where: { projectId },
    });
    if (existing) {
      return existing;
    }
    const diagram = this.diagramsRepository.create({ projectId });
    return this.diagramsRepository.save(diagram);
  }

  saveDiagram(diagram: UmlDiagram): Promise<UmlDiagram> {
    return this.diagramsRepository.save(diagram);
  }

  listClasses(diagramId: string): Promise<UmlClassNode[]> {
    return this.classesRepository.find({ where: { diagramId } });
  }

  listRelations(diagramId: string): Promise<UmlRelation[]> {
    return this.relationsRepository.find({ where: { diagramId } });
  }

  findClassById(id: string): Promise<UmlClassNode | null> {
    return this.classesRepository.findOne({ where: { id } });
  }

  findRelationById(id: string): Promise<UmlRelation | null> {
    return this.relationsRepository.findOne({ where: { id } });
  }

  saveClass(node: UmlClassNode): Promise<UmlClassNode> {
    return this.classesRepository.save(node);
  }

  saveRelation(relation: UmlRelation): Promise<UmlRelation> {
    return this.relationsRepository.save(relation);
  }

  async deleteNode(diagramId: string, nodeId: string): Promise<void> {
    await this.classesRepository.delete({ id: nodeId, diagramId });
  }

  async deleteRelationsFromNode(
    diagramId: string,
    nodeId: string,
  ): Promise<UmlRelation[]> {
    const relations = await this.relationsRepository.find({
      where: [
        { diagramId, sourceNodeId: nodeId },
        { diagramId, targetNodeId: nodeId },
      ],
    });
    if (relations.length > 0) {
      await this.relationsRepository.delete({
        diagramId,
        id: In(relations.map((relation) => relation.id)),
      });
    }
    return relations;
  }

  async deleteRelation(diagramId: string, edgeId: string): Promise<void> {
    await this.relationsRepository.delete({ id: edgeId, diagramId });
  }

  async deleteDiagramDataByProject(projectId: string): Promise<void> {
    const diagram = await this.diagramsRepository.findOne({
      where: { projectId },
    });
    if (!diagram) {
      return;
    }
    await this.relationsRepository.delete({ diagramId: diagram.id });
    await this.classesRepository.delete({ diagramId: diagram.id });
    await this.diagramsRepository.delete(diagram.id);
  }
}

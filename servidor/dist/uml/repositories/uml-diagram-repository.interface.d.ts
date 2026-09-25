import { UmlClassNode } from '../entities/uml-class-node.entity';
import { UmlDiagram } from '../entities/uml-diagram.entity';
import { UmlRelation } from '../entities/uml-relation.entity';
export interface UmlDiagramRepository {
    findOrCreateForProject(projectId: string): Promise<UmlDiagram>;
    saveDiagram(diagram: UmlDiagram): Promise<UmlDiagram>;
    listClasses(diagramId: string): Promise<UmlClassNode[]>;
    listRelations(diagramId: string): Promise<UmlRelation[]>;
    findClassById(id: string): Promise<UmlClassNode | null>;
    findRelationById(id: string): Promise<UmlRelation | null>;
    saveClass(node: UmlClassNode): Promise<UmlClassNode>;
    saveRelation(relation: UmlRelation): Promise<UmlRelation>;
    deleteNode(diagramId: string, nodeId: string): Promise<void>;
    deleteRelationsFromNode(diagramId: string, nodeId: string): Promise<UmlRelation[]>;
    deleteRelation(diagramId: string, edgeId: string): Promise<void>;
    deleteDiagramDataByProject(projectId: string): Promise<void>;
}
export declare const UML_DIAGRAM_REPOSITORY: unique symbol;

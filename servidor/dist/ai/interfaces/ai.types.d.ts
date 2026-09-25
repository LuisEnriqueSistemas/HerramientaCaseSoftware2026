import type { UmlClassAttribute, UmlClassMethod } from '../../uml/entities/uml-class-node.entity';
import type { UmlRelationType } from '../../uml/entities/uml-relation.entity';
export interface GeneratedClass {
    name: string;
    attributes?: UmlClassAttribute[];
    methods?: UmlClassMethod[];
    x?: number;
    y?: number;
}
export interface GeneratedRelation {
    source: string;
    target: string;
    type: Extract<UmlRelationType, 'ASSOCIATION' | 'AGGREGATION' | 'COMPOSITION'>;
    sourceMin?: number;
    sourceMax?: number | null;
    targetMin?: number;
    targetMax?: number | null;
    sourceRole?: string | null;
    targetRole?: string | null;
}
export interface GeneratedDiagram {
    classes: GeneratedClass[];
    relations: GeneratedRelation[];
}
export interface AiDiagramGeneratedEvent {
    projectId: string;
    diagram: unknown;
}

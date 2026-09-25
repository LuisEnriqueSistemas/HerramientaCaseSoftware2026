import type {
  UmlClassAttribute,
  UmlClassMethod,
} from '../entities/uml-class-node.entity';
import type { UmlDiagramModelType } from '../entities/uml-diagram.entity';
import type { UmlRelationType } from '../entities/uml-relation.entity';

export class UmlNodeResponseDto {
  id: string;
  name: string;
  tableName?: string | null;
  description?: string | null;
  x: number;
  y: number;
  attributes: UmlClassAttribute[];
  methods: UmlClassMethod[];
  updatedAt: string;
}

export class UmlEdgeResponseDto {
  id: string;
  sourceId: string;
  targetId: string;
  type: UmlRelationType;
  sourceMin: number;
  sourceMax: number | null;
  targetMin: number;
  targetMax: number | null;
  sourceRole: string | null;
  targetRole: string | null;
  updatedAt: string;
}

export class UmlDiagramResponseDto {
  diagramId: string;
  projectId: string;
  version: number;
  modelType?: UmlDiagramModelType;
  canEdit: boolean;
  nodes: UmlNodeResponseDto[];
  edges: UmlEdgeResponseDto[];
}

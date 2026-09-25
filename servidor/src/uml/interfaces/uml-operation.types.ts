import type {
  UmlClassAttribute,
  UmlClassMethod,
} from '../entities/uml-class-node.entity';
import type { UmlDiagramModelType } from '../entities/uml-diagram.entity';
import type { UmlRelationType } from '../entities/uml-relation.entity';

export const UML_SOCKET_EVENTS = {
  DIAGRAM_TYPE_UPDATED: 'uml:diagram_type_updated',
  DIAGRAM_GENERATED: 'uml:diagram_generated',
  NODE_ADDED: 'uml:node_added',
  NODE_UPDATED: 'uml:node_updated',
  NODE_DELETED: 'uml:node_deleted',
  RELATION_ADDED: 'uml:relation_added',
  RELATION_UPDATED: 'uml:relation_updated',
  RELATION_DELETED: 'uml:relation_deleted',
} as const;

export interface UmlDiagramTypeChangedEvent {
  projectId: string;
  modelType: UmlDiagramModelType;
  version: number;
}

export interface UmlNodeInput {
  id: string;
  name: string;
  x: number;
  y: number;
  attributes?: UmlClassAttribute[];
  methods?: UmlClassMethod[];
  tableName?: string;
  description?: string | null;
}

export interface UmlNodePatch {
  name?: string;
  x?: number;
  y?: number;
  attributes?: UmlClassAttribute[];
  methods?: UmlClassMethod[];
  tableName?: string;
  description?: string | null;
}

export interface UmlRelationInput {
  id: string;
  sourceId: string;
  targetId: string;
  type: UmlRelationType;
  sourceMin?: number;
  sourceMax?: number | null;
  targetMin?: number;
  targetMax?: number | null;
  sourceRole?: string | null;
  targetRole?: string | null;
}

export interface AddUmlNodePayload {
  projectId: string;
  node: UmlNodeInput;
}

export interface UpdateUmlNodePayload {
  projectId: string;
  nodeId: string;
  patch: UmlNodePatch;
}

export interface DeleteUmlNodePayload {
  projectId: string;
  nodeId: string;
}

export interface AddUmlRelationPayload {
  projectId: string;
  edge: UmlRelationInput;
}

export interface UmlRelationPatch {
  type?: UmlRelationType;
  sourceMin?: number;
  sourceMax?: number | null;
  targetMin?: number;
  targetMax?: number | null;
  sourceRole?: string | null;
  targetRole?: string | null;
}

export interface UpdateUmlRelationPayload {
  projectId: string;
  edgeId: string;
  patch: UmlRelationPatch;
}

export interface DeleteUmlRelationPayload {
  projectId: string;
  edgeId: string;
}

export interface UmlNodeChangedEvent {
  projectId: string;
  node: {
    id: string;
    name: string;
    x: number;
    y: number;
    attributes: UmlClassAttribute[];
    methods: UmlClassMethod[];
    updatedAt: string;
  };
  version: number;
}

export interface UmlRelationChangedEvent {
  projectId: string;
  edge: {
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
  };
  version: number;
}

export interface UmlNodeDeletedEvent {
  projectId: string;
  nodeId: string;
  deletedRelationIds: string[];
  version: number;
}

export interface UmlRelationDeletedEvent {
  projectId: string;
  edgeId: string;
  version: number;
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

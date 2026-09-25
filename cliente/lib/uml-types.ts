export type UmlVisibility = "public" | "private" | "protected";
export type UmlDiagramModelType = "CLASS" | "ER_LOGICAL";
export type ErKeyType = "NONE" | "PK" | "FK";

export interface UmlClassAttribute {
  id?: string;
  visibility: UmlVisibility;
  name: string;
  type: string;
  nullable?: boolean;
  keyType?: ErKeyType;
  isCompositeKey?: boolean;
  unique?: boolean;
  referencesEntityId?: string | null;
  referencesAttributeId?: string | null;
}

export interface UmlClassMethod {
  visibility: UmlVisibility;
  name: string;
  parameters: string;
  returnType: string;
}

export type UmlRelationKind =
  | "ASSOCIATION"
  | "INHERITANCE"
  | "REALIZATION"
  | "AGGREGATION"
  | "COMPOSITION"
  | "DEPENDENCY";

export interface UmlClassNode {
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

export interface UmlRelationAnchor {
  angle: number;
}

export interface UmlClassEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: UmlRelationKind;
  sourceMin: number;
  sourceMax: number | null;
  targetMin: number;
  targetMax: number | null;
  sourceRole: string | null;
  targetRole: string | null;
  sourceAnchor?: UmlRelationAnchor | null;
  targetAnchor?: UmlRelationAnchor | null;
  updatedAt: string;
}

export interface UmlDiagram {
  diagramId: string;
  projectId: string;
  version: number;
  modelType?: UmlDiagramModelType;
  canEdit: boolean;
  nodes: UmlClassNode[];
  edges: UmlClassEdge[];
}

export interface UmlNodeChangedPayload {
  projectId: string;
  node: UmlClassNode;
  version: number;
}

export interface UmlNodeDeletedPayload {
  projectId: string;
  nodeId: string;
  deletedRelationIds: string[];
  version: number;
}

export interface UmlEdgeChangedPayload {
  projectId: string;
  edge: UmlClassEdge;
  version: number;
}

export interface UmlEdgeDeletedPayload {
  projectId: string;
  edgeId: string;
  version: number;
}

export interface UmlDiagramTypeChangedPayload {
  projectId: string;
  modelType: UmlDiagramModelType;
  version: number;
}

export interface UmlAddNodePayload {
  projectId: string;
  node: {
    id: string;
    name: string;
    x: number;
    y: number;
    attributes: UmlClassAttribute[];
    methods: UmlClassMethod[];
  };
}

export interface UmlUpdateNodePayload {
  projectId: string;
  nodeId: string;
  patch: {
    name?: string;
    x?: number;
    y?: number;
    attributes?: UmlClassAttribute[];
    methods?: UmlClassMethod[];
  };
}

export interface UmlDeleteNodePayload {
  projectId: string;
  nodeId: string;
}

export interface UmlAddEdgePayload {
  projectId: string;
  edge: {
    id: string;
    sourceId: string;
    targetId: string;
    type: UmlRelationKind;
    sourceMin?: number;
    sourceMax?: number | null;
    targetMin?: number;
    targetMax?: number | null;
    sourceRole?: string;
    targetRole?: string;
  };
}

export interface UmlEdgePatch {
  type?: UmlRelationKind;
  sourceMin?: number;
  sourceMax?: number | null;
  targetMin?: number;
  targetMax?: number | null;
  sourceRole?: string | null;
  targetRole?: string | null;
  sourceAnchor?: UmlRelationAnchor | null;
  targetAnchor?: UmlRelationAnchor | null;
}

export interface UmlDeleteEdgePayload {
  projectId: string;
  edgeId: string;
}

export interface UmlUpdateEdgePayload {
  projectId: string;
  edgeId: string;
  patch: UmlEdgePatch;
}

export const UML_NODE_TYPES = {
  CLASS: "umlClass",
} as const;

export const UML_RELATION_LABELS: Record<UmlRelationKind, string> = {
  ASSOCIATION: "Asociación",
  INHERITANCE: "Herencia",
  REALIZATION: "Realización",
  AGGREGATION: "Agregación",
  COMPOSITION: "Composición",
  DEPENDENCY: "Dependencia",
};

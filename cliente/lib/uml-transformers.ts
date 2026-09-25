import type {
  Edge,
  Node,
} from "@xyflow/react";
import {
  UML_NODE_TYPES,
  UML_RELATION_LABELS,
  type UmlClassEdge,
  type UmlClassNode,
  type UmlEdgePatch,
  type UmlRelationAnchor,
  type UmlRelationKind,
} from "./uml-types";

export interface UmlClassNodeData {
  name: string;
  attributes: UmlClassNode["attributes"];
  methods: UmlClassNode["methods"];
  modelType?: "CLASS" | "ER_LOGICAL";
  tableName?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

export interface UmlClassFlowEdgeData {
  type: UmlRelationKind;
  sourceMin: number;
  sourceMax: number | null;
  targetMin: number;
  targetMax: number | null;
  sourceRole: string | null;
  targetRole: string | null;
  sourceAnchor?: UmlRelationAnchor | null;
  targetAnchor?: UmlRelationAnchor | null;
  [key: string]: unknown;
}

export type UmlClassFlowNode = Node<UmlClassNodeData, "umlClass">;
export type UmlClassFlowEdge = Edge<UmlClassFlowEdgeData>;

export interface MultiplicityPreset {
  value: string;
  label: string;
  min: number;
  max: number | null;
}

export const MULTIPLICITY_PRESETS: MultiplicityPreset[] = [
  { value: "1", label: "1", min: 1, max: 1 },
  { value: "0..1", label: "0..1", min: 0, max: 1 },
  { value: "0..*", label: "0..*", min: 0, max: null },
  { value: "1..*", label: "1..*", min: 1, max: null },
];

export function multiplicityForPreset(
  value: string,
): { min: number; max: number | null } {
  const preset = MULTIPLICITY_PRESETS.find((item) => item.value === value);
  if (!preset) {
    return { min: 1, max: 1 };
  }
  return { min: preset.min, max: preset.max };
}

export function presetLabelForMultiplicity(
  min: number,
  max: number | null,
): string {
  const preset = MULTIPLICITY_PRESETS.find(
    (item) => item.min === min && item.max === max,
  );
  return preset ? preset.label : formatMultiplicity(min, max);
}

export interface UmlEdgeStyle {
  type: "step";
  style: {
    stroke: "#000";
    strokeWidth: 2;
    strokeDasharray?: string;
  };
  markerEnd?: string;
  markerStart?: string;
}

export const ESTILOS_RELACIONES: Record<UmlRelationKind, UmlEdgeStyle> = {
  ASSOCIATION: {
    type: "step",
    style: { stroke: "#000", strokeWidth: 2 },
    markerEnd: "url(#arrow)",
  },
  INHERITANCE: {
    type: "step",
    style: { stroke: "#000", strokeWidth: 2 },
    markerEnd: "url(#triangle)",
  },
  REALIZATION: {
    type: "step",
    style: { stroke: "#000", strokeWidth: 2, strokeDasharray: "5,5" },
    markerEnd: "url(#triangle)",
  },
  DEPENDENCY: {
    type: "step",
    style: { stroke: "#000", strokeWidth: 2, strokeDasharray: "5,5" },
    markerEnd: "url(#arrow)",
  },
  AGGREGATION: {
    type: "step",
    style: { stroke: "#000", strokeWidth: 2 },
    markerStart: "url(#diamond)",
    markerEnd: "url(#arrow)",
  },
  COMPOSITION: {
    type: "step",
    style: { stroke: "#000", strokeWidth: 2 },
    markerStart: "url(#diamond-filled)",
    markerEnd: "url(#arrow)",
  },
};

export function relationLabel(type: UmlRelationKind): string {
  return UML_RELATION_LABELS[type];
}

export function edgeStyle(type: UmlRelationKind): UmlEdgeStyle {
  return ESTILOS_RELACIONES[type];
}

export function formatMultiplicity(
  min: number,
  max: number | null,
): string {
  if (min === 1 && max === 1) {
    return "1";
  }
  if (min === 0 && max === 1) {
    return "0..1";
  }
  if (max === null) {
    return `${min}..*`;
  }
  return `${min}..${max}`;
}

export const UML_NODE_WIDTH = 220;
export const UML_NODE_HEIGHT = 180;

export function toFlowNode(
  node: UmlClassNode,
  modelType: "CLASS" | "ER_LOGICAL" = "CLASS",
): UmlClassFlowNode {
  return {
    id: node.id,
    type: UML_NODE_TYPES.CLASS,
    position: { x: node.x, y: node.y },
    width: UML_NODE_WIDTH,
    height: UML_NODE_HEIGHT,
    style: { width: UML_NODE_WIDTH, height: UML_NODE_HEIGHT },
    data: {
      name: node.name,
      attributes: node.attributes.map((a) => ({
        ...a,
        id: a.id ?? crypto.randomUUID(),
      })),
      methods: node.methods,
      ...(modelType === "ER_LOGICAL"
        ? {
            modelType,
            tableName: node.name,
            description: node.description ?? null,
          }
        : {}),
    },
  };
}

export function toFlowNodes(
  nodes: UmlClassNode[],
  modelType: "CLASS" | "ER_LOGICAL" = "CLASS",
): UmlClassFlowNode[] {
  return nodes.map((node) => toFlowNode(node, modelType));
}

export function toFlowEdge(edge: UmlClassEdge): UmlClassFlowEdge {
  const { style, markerEnd, markerStart } = edgeStyle(edge.type);
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    type: "uml",
    // Edge limpio: solo línea y flechas. La cardinalidad se renderiza
    // anclada al nodo (CardinalityLabel dentro de UmlClassNodeComponent).
    label: "",
    data: {
      type: edge.type,
      sourceMin: edge.sourceMin,
      sourceMax: edge.sourceMax,
      targetMin: edge.targetMin,
      targetMax: edge.targetMax,
      sourceRole: edge.sourceRole,
      targetRole: edge.targetRole,
      sourceAnchor: edge.sourceAnchor ?? null,
      targetAnchor: edge.targetAnchor ?? null,
    },
    style,
    ...(markerEnd ? { markerEnd } : {}),
    ...(markerStart ? { markerStart } : {}),
  };
}

export function toFlowEdges(edges: UmlClassEdge[]): UmlClassFlowEdge[] {
  return edges.map((edge) => toFlowEdge(edge));
}

export function flowEdgeFor(options: {
  id: string;
  type: UmlRelationKind;
  source: string;
  target: string;
  sourceMin?: number;
  sourceMax?: number | null;
  targetMin?: number;
  targetMax?: number | null;
}): UmlClassFlowEdge {
  return toFlowEdge({
    id: options.id,
    sourceId: options.source,
    targetId: options.target,
    type: options.type,
    sourceMin: options.sourceMin ?? 1,
    sourceMax: options.sourceMax === undefined ? 1 : options.sourceMax,
    targetMin: options.targetMin ?? 1,
    targetMax: options.targetMax === undefined ? 1 : options.targetMax,
    sourceRole: null,
    targetRole: null,
    updatedAt: new Date().toISOString(),
  });
}

export function applyEdgePatch(
  edge: UmlClassFlowEdge,
  patch: UmlEdgePatch,
): UmlClassFlowEdge {
  const current: UmlClassFlowEdgeData = edge.data ?? {
    type: "ASSOCIATION",
    sourceMin: 1,
    sourceMax: 1,
    targetMin: 1,
    targetMax: 1,
    sourceRole: null,
    targetRole: null,
    sourceAnchor: null,
    targetAnchor: null,
  };
  const data: UmlClassFlowEdgeData = {
    type: patch.type ?? current.type,
    sourceMin: patch.sourceMin ?? current.sourceMin,
    sourceMax:
      patch.sourceMax === undefined ? current.sourceMax : patch.sourceMax,
    targetMin: patch.targetMin ?? current.targetMin,
    targetMax:
      patch.targetMax === undefined ? current.targetMax : patch.targetMax,
    sourceRole:
      patch.sourceRole === undefined ? current.sourceRole : patch.sourceRole,
    targetRole:
      patch.targetRole === undefined ? current.targetRole : patch.targetRole,
    sourceAnchor:
      patch.sourceAnchor === undefined
        ? (current.sourceAnchor ?? null)
        : patch.sourceAnchor,
    targetAnchor:
      patch.targetAnchor === undefined
        ? (current.targetAnchor ?? null)
        : patch.targetAnchor,
  };
  return toFlowEdge({
    id: edge.id,
    sourceId: edge.source,
    targetId: edge.target,
    type: data.type,
    sourceMin: data.sourceMin,
    sourceMax: data.sourceMax,
    targetMin: data.targetMin,
    targetMax: data.targetMax,
    sourceRole: data.sourceRole,
    targetRole: data.targetRole,
    sourceAnchor: data.sourceAnchor ?? null,
    targetAnchor: data.targetAnchor ?? null,
    updatedAt: new Date().toISOString(),
  });
}

export function edgeToServer(
  edge: UmlClassFlowEdge,
  type: UmlRelationKind,
): UmlClassEdge {
  const data = edge.data;
  return {
    id: edge.id,
    sourceId: edge.source,
    targetId: edge.target,
    type,
    sourceMin: data?.sourceMin ?? 1,
    sourceMax: data?.sourceMax === undefined ? 1 : data.sourceMax,
    targetMin: data?.targetMin ?? 1,
    targetMax: data?.targetMax === undefined ? 1 : data.targetMax,
    sourceRole: data?.sourceRole ?? null,
    targetRole: data?.targetRole ?? null,
    sourceAnchor: data?.sourceAnchor ?? null,
    targetAnchor: data?.targetAnchor ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export function nodePatchForData(data: UmlClassNodeData): {
  name: string;
  attributes: UmlClassNode["attributes"];
  methods: UmlClassNode["methods"];
} {
  return {
    name: data.name,
    attributes: data.attributes,
    methods: data.methods,
  };
}

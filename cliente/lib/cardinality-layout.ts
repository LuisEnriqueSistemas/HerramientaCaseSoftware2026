import { UML_NODE_HEIGHT, UML_NODE_WIDTH } from "./uml-transformers";

export type CardinalitySide = "top" | "right" | "bottom" | "left";

export const CARDINALITY_EDGE_OFFSET_PX = 10;
export const CARDINALITY_STACK_STEP_PX = 18;

export const ANCHOR_LABEL_OUT_PX = 16;
export const ANCHOR_LABEL_STACK_PX = 12;

export interface NodeBox {
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
}

export interface MeasuredNode {
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
  measured?: {
    width?: number | null;
    height?: number | null;
  } | null;
}

export const FALLBACK_NODE_WIDTH_PX = UML_NODE_WIDTH;
export const FALLBACK_NODE_HEIGHT_PX = UML_NODE_HEIGHT;

export function nodeBoxOf(
  node: MeasuredNode,
  fallbackWidth: number = FALLBACK_NODE_WIDTH_PX,
  fallbackHeight: number = FALLBACK_NODE_HEIGHT_PX,
): NodeBox {
  return {
    position: node.position,
    width: node.measured?.width ?? node.width ?? fallbackWidth,
    height: node.measured?.height ?? node.height ?? fallbackHeight,
  };
}

export function resolveCardinalitySide(
  selfX: number,
  selfY: number,
  neighborX: number,
  neighborY: number,
): CardinalitySide {
  const dx = neighborX - selfX;
  const dy = neighborY - selfY;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "bottom" : "top";
}

export function centeredStackOffsets(
  count: number,
  stepPx: number = CARDINALITY_STACK_STEP_PX,
): number[] {
  if (count <= 0) {
    return [];
  }
  return Array.from(
    { length: count },
    (_, index) => (index - (count - 1) / 2) * stepPx,
  );
}

export function anchorPointOnRect(node: NodeBox, angle: number) {
  const w = (node.width ?? 0) / 2;
  const h = (node.height ?? 0) / 2;
  const cx = node.position.x + w;
  const cy = node.position.y + h;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const t = Math.min(
    Math.abs(dx) > 1e-9 ? w / Math.abs(dx) : Infinity,
    Math.abs(dy) > 1e-9 ? h / Math.abs(dy) : Infinity,
  );
  return { x: cx + dx * t, y: cy + dy * t };
}

// Punto donde se dibuja la etiqueta de cardinalidad: sale del borde hacia
// afuera en la dirección del ancla y se apila en el eje perpendicular si hay
// varias relaciones en el mismo punto.
export function cardinalityLabelPosition(
  node: NodeBox,
  angle: number,
  stackIndex = 0,
) {
  const point = anchorPointOnRect(node, angle);
  const cx = node.position.x + (node.width ?? 0) / 2;
  const cy = node.position.y + (node.height ?? 0) / 2;
  const vx = point.x - cx;
  const vy = point.y - cy;
  const length = Math.hypot(vx, vy) || 1;
  const ux = vx / length;
  const uy = vy / length;
  const px = -uy;
  const py = ux;
  return {
    x: point.x + ux * ANCHOR_LABEL_OUT_PX + px * (stackIndex * ANCHOR_LABEL_STACK_PX),
    y: point.y + uy * ANCHOR_LABEL_OUT_PX + py * (stackIndex * ANCHOR_LABEL_STACK_PX),
  };
}

export function angleBucket(angle: number, resolution = 8): number {
  return Math.round(angle * resolution);
}

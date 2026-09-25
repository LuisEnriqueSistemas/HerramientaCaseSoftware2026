"use client";

import {
  BaseEdge,
  Position,
  getSmoothStepPath,
  useNodes,
  type EdgeProps,
} from "@xyflow/react";
import { anchorPointOnRect, nodeBoxOf, type NodeBox } from "@/lib/cardinality-layout";
import type { UmlClassFlowEdge, UmlClassFlowNode } from "@/lib/uml-transformers";

export const UML_EDGE_TYPE = "uml";
export const NEON_GREEN = "#39FF14";

function positionFromAngle(angle: number): Position {
  const degrees = ((angle * 180) / Math.PI) % 360;
  const normalized = degrees < 0 ? degrees + 360 : degrees;
  if (normalized >= 315 || normalized < 45) {
    return Position.Right;
  }
  if (normalized >= 45 && normalized < 135) {
    return Position.Bottom;
  }
  if (normalized >= 135 && normalized < 225) {
    return Position.Left;
  }
  return Position.Top;
}

function positionFromHandle(
  handleId: string | null | undefined,
  fallback: Position,
): Position {
  if (typeof handleId === "string") {
    const suffix = handleId.split("-").pop()?.toLowerCase();
    if (suffix === "top") {
      return Position.Top;
    }
    if (suffix === "right") {
      return Position.Right;
    }
    if (suffix === "bottom") {
      return Position.Bottom;
    }
    if (suffix === "left") {
      return Position.Left;
    }
  }
  return fallback;
}

function borderPointForSide(box: NodeBox, side: Position) {
  const width = box.width ?? 0;
  const height = box.height ?? 0;
  switch (side) {
    case Position.Top:
      return { x: box.position.x + width / 2, y: box.position.y };
    case Position.Bottom:
      return {
        x: box.position.x + width / 2,
        y: box.position.y + height,
      };
    case Position.Left:
      return { x: box.position.x, y: box.position.y + height / 2 };
    case Position.Right:
    default:
      return {
        x: box.position.x + width,
        y: box.position.y + height / 2,
      };
  }
}

export function UmlEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  selected,
  data,
  markerStart,
  markerEnd,
  style,
}: EdgeProps<UmlClassFlowEdge>) {
  const nodes = useNodes<UmlClassFlowNode>();
  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourceBox = nodeBoxOf(sourceNode);
  const targetBox = nodeBoxOf(targetNode);
  const sourceAngle = data?.sourceAnchor?.angle;
  const targetAngle = data?.targetAnchor?.angle;

  const sourcePosition =
    typeof sourceAngle === "number"
      ? positionFromAngle(sourceAngle)
      : positionFromHandle(sourceHandleId, Position.Right);
  const targetPosition =
    typeof targetAngle === "number"
      ? positionFromAngle(targetAngle)
      : positionFromHandle(targetHandleId, Position.Left);

  const start =
    typeof sourceAngle === "number"
      ? anchorPointOnRect(sourceBox, sourceAngle)
      : borderPointForSide(sourceBox, sourcePosition);
  const end =
    typeof targetAngle === "number"
      ? anchorPointOnRect(targetBox, targetAngle)
      : borderPointForSide(targetBox, targetPosition);

  const [path] = getSmoothStepPath({
    sourceX: start.x,
    sourceY: start.y,
    sourcePosition,
    targetX: end.x,
    targetY: end.y,
    targetPosition,
    borderRadius: 0,
  });

  const isSelected = selected === true;
  const baseStroke =
    typeof style?.stroke === "string" ? style.stroke : "#000";
  const baseStrokeWidth =
    typeof style?.strokeWidth === "number" ? style.strokeWidth : 2;
  const filter = isSelected
    ? `drop-shadow(0 0 4px ${NEON_GREEN}) drop-shadow(0 0 10px ${NEON_GREEN}) drop-shadow(0 0 18px ${NEON_GREEN}aa)`
    : undefined;

  return (
    <g style={filter ? { filter, transition: "filter 120ms ease" } : undefined}>
      <BaseEdge
        id={id}
        path={path}
        style={{
          ...(style ?? {}),
          stroke: isSelected ? NEON_GREEN : baseStroke,
          strokeWidth: isSelected ? 2.5 : baseStrokeWidth,
        }}
        markerStart={markerStart}
        markerEnd={markerEnd}
        interactionWidth={18}
      />
    </g>
  );
}

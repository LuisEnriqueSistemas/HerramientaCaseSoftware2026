"use client";

import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { anchorPointOnRect, type NodeBox } from "@/lib/cardinality-layout";

const HANDLE_SIZE_PX = 12;
const NEON_GREEN = "#39FF14";

interface AnchorHandleProps {
  node: NodeBox;
  angle: number;
  onChange: (angle: number) => void;
  onCommit: (angle: number) => void;
}

export function AnchorHandle({ node, angle, onChange, onCommit }: AnchorHandleProps) {
  const { screenToFlowPosition } = useReactFlow();
  const [localAngle, setLocalAngle] = useState(angle);

  const angleFromClient = (clientX: number, clientY: number): number => {
    const point = screenToFlowPosition({ x: clientX, y: clientY });
    const cx = node.position.x + (node.width ?? 0) / 2;
    const cy = node.position.y + (node.height ?? 0) / 2;
    return Math.atan2(point.y - cy, point.x - cx);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const handleMove = (moveEvent: PointerEvent) => {
      const next = angleFromClient(moveEvent.clientX, moveEvent.clientY);
      setLocalAngle(next);
      onChange(next);
    };
    const handleUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onCommit(angleFromClient(upEvent.clientX, upEvent.clientY));
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const point = anchorPointOnRect(node, localAngle);

  return (
    <div
      data-testid="anchor-handle"
      className="nodrag nopan"
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        left: point.x - node.position.x - HANDLE_SIZE_PX / 2,
        top: point.y - node.position.y - HANDLE_SIZE_PX / 2,
        width: HANDLE_SIZE_PX,
        height: HANDLE_SIZE_PX,
        borderRadius: "50%",
        background: NEON_GREEN,
        boxShadow: `0 0 8px ${NEON_GREEN}, 0 0 14px ${NEON_GREEN}aa`,
        cursor: "grab",
        zIndex: 20,
      }}
    />
  );
}

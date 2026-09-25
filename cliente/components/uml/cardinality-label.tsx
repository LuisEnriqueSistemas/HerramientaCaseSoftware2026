"use client";

import type { CSSProperties } from "react";
import {
  CARDINALITY_EDGE_OFFSET_PX,
  type CardinalitySide,
} from "@/lib/cardinality-layout";

interface CardinalityLabelProps {
  cardinality: string;
  side: CardinalitySide;
  offset: number;
  position?: { x: number; y: number };
}

function positionFor(side: CardinalitySide, offset: number): CSSProperties {
  const outside = -CARDINALITY_EDGE_OFFSET_PX;
  switch (side) {
    case "top":
      return {
        top: outside,
        left: `calc(50% + ${offset}px)`,
        transform: "translate(-50%, -100%)",
      };
    case "bottom":
      return {
        bottom: outside,
        left: `calc(50% + ${offset}px)`,
        transform: "translate(-50%, 100%)",
      };
    case "left":
      return {
        left: outside,
        top: `calc(50% + ${offset}px)`,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        right: outside,
        top: `calc(50% + ${offset}px)`,
        transform: "translate(100%, -50%)",
      };
  }
}

export function CardinalityLabel({
  cardinality,
  side,
  offset,
  position,
}: CardinalityLabelProps) {
  const style: CSSProperties = position
    ? {
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }
    : positionFor(side, offset);
  return (
    <span
      data-testid="cardinality-label"
      data-side={side}
      className="nodrag nopan pointer-events-none absolute z-10 whitespace-nowrap rounded border border-zinc-300 bg-white px-1 font-mono text-[10px] leading-tight text-zinc-700 shadow-sm"
      style={style}
    >
      {cardinality}
    </span>
  );
}

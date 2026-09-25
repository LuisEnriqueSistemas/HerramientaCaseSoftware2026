"use client";

import { createContext, useContext } from "react";

export type AnchorEnd = "source" | "target";

interface AnchorEditContextValue {
  selectedEdgeId: string | null;
  canEdit: boolean;
  onAnchorPreview: (edgeId: string, end: AnchorEnd, angle: number) => void;
  onAnchorCommit: (edgeId: string, end: AnchorEnd, angle: number) => void;
}

const noop = () => {};

export const AnchorEditContext = createContext<AnchorEditContextValue>({
  selectedEdgeId: null,
  canEdit: false,
  onAnchorPreview: noop,
  onAnchorCommit: noop,
});

export function useAnchorEdit(): AnchorEditContextValue {
  return useContext(AnchorEditContext);
}

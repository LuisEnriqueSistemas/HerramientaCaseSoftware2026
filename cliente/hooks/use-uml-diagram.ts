"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectDiagram } from "@/lib/api";
import type { UmlDiagram } from "@/lib/uml-types";

export const UML_KEYS = {
  diagram: (projectId: string) => ["uml", "diagram", projectId] as const,
};

export function useUmlDiagram(projectId: string, enabled: boolean) {
  return useQuery<UmlDiagram>({
    queryKey: UML_KEYS.diagram(projectId),
    queryFn: (): Promise<UmlDiagram> => getProjectDiagram(projectId),
    enabled: Boolean(projectId) && enabled,
    staleTime: Infinity,
  });
}
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUmlDiagram } from "@/hooks/use-uml-diagram";
import { createTestQueryClient, createWrapper } from "@/test/utils";

describe("useUmlDiagram", () => {
  it("obtiene el diagrama del proyecto", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUmlDiagram("proyecto-1", true), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      diagramId: "diagrama-1",
      projectId: "proyecto-1",
      canEdit: true,
      version: 1,
    });
    expect(result.current.data?.nodes).toHaveLength(1);
    expect(result.current.data?.nodes[0]).toMatchObject({
      id: "nodo-1",
      name: "Usuario",
    });
  });

  it("no ejecuta la petición cuando está deshabilitada", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUmlDiagram("", true), {
      wrapper: createWrapper(queryClient),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.isFetched).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
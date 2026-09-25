import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  useCreateProject,
  useDeleteProject,
  useProjectMembers,
  useProjects,
} from "@/hooks/use-projects";
import { PROJECT_KEYS } from "@/hooks/use-projects";
import {
  createTestQueryClient,
  createWrapper,
} from "@/test/utils";

describe("useProjects", () => {
  it("obtiene la lista de proyectos", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      id: "proyecto-1",
      name: "Sistema de ventas",
      memberRole: "HOST",
    });
  });
});

describe("useCreateProject", () => {
  it("crea un proyecto e invalida la lista", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(PROJECT_KEYS.list(), []);
    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(queryClient),
    });

    let createdId = "";
    await act(async () => {
      createdId = (await result.current.mutateAsync({
        name: "Ventas",
        description: "Módulo de ventas",
      })).id;
    });

    expect(createdId).toBe("proyecto-nuevo");

    await waitFor(() => {
      expect(queryClient.isFetching({ queryKey: PROJECT_KEYS.all })).toBe(0);
    });
  });
});

describe("useDeleteProject", () => {
  it("elimina un proyecto e invalida la lista", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(PROJECT_KEYS.list(), []);
    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("proyecto-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await waitFor(() => {
      expect(queryClient.isFetching({ queryKey: PROJECT_KEYS.all })).toBe(0);
    });
  });
});

describe("useProjectMembers", () => {
  it("obtiene los miembros cuando está habilitada", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useProjectMembers("proyecto-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      role: "HOST",
      email: "ana@dominio.com",
    });
  });

  it("no ejecuta la petición cuando está deshabilitada", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useProjectMembers("proyecto-1", false), {
      wrapper: createWrapper(queryClient),
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.isFetched).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const handlerRegistry = new Map<string, (payload: unknown) => void>();
  const fakeSocket = {
    connect: vi.fn(),
    on: vi.fn((event: string, handler: (payload: unknown) => void) => {
      handlerRegistry.set(event, handler);
    }),
    off: vi.fn((event: string) => {
      handlerRegistry.delete(event);
    }),
    emit: vi.fn(),
  };
  return {
    handlerRegistry,
    fakeSocket,
    joinProjectRoom: vi.fn(),
    leaveProjectRoom: vi.fn(),
    disconnectSocket: vi.fn(),
  };
});

vi.mock("@/lib/socket", () => ({
  UML_SOCKET_EVENTS: {
    NODE_ADDED: "uml:node_added",
    NODE_UPDATED: "uml:node_updated",
    NODE_DELETED: "uml:node_deleted",
     RELATION_ADDED: "uml:relation_added",
     RELATION_UPDATED: "uml:relation_updated",
     RELATION_DELETED: "uml:relation_deleted",
     DIAGRAM_GENERATED: "uml:diagram_generated",
     DIAGRAM_TYPE_UPDATED: "uml:diagram_type_updated",
  },
  PROJECT_SOCKET_EVENTS: {
    PROJECT_DELETED: "project_deleted",
  },
  getSocket: () => mocks.fakeSocket,
  joinProjectRoom: mocks.joinProjectRoom,
  leaveProjectRoom: mocks.leaveProjectRoom,
  disconnectSocket: mocks.disconnectSocket,
}));

import { useUmlSocket } from "@/hooks/use-uml-socket";

const emptyHandlers = () => ({
  onNodeChanged: vi.fn(),
  onNodeDeleted: vi.fn(),
  onRelationChanged: vi.fn(),
  onRelationDeleted: vi.fn(),
  onDiagramGenerated: vi.fn(),
  onDiagramTypeChanged: vi.fn(),
});

const waitForEffect = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe("useUmlSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handlerRegistry.clear();
  });

   it("se une a la sala del proyecto y registra los 6 eventos UML", async () => {
    renderHook(() => useUmlSocket("proyecto-1", emptyHandlers()));
    await waitForEffect();

    expect(mocks.fakeSocket.connect).toHaveBeenCalled();
    expect(mocks.joinProjectRoom).toHaveBeenCalledWith("proyecto-1");
    expect(mocks.handlerRegistry.has("uml:node_added")).toBe(true);
    expect(mocks.handlerRegistry.has("uml:node_updated")).toBe(true);
    expect(mocks.handlerRegistry.has("uml:node_deleted")).toBe(true);
     expect(mocks.handlerRegistry.has("uml:relation_added")).toBe(true);
     expect(mocks.handlerRegistry.has("uml:relation_updated")).toBe(true);
    expect(mocks.handlerRegistry.has("uml:relation_deleted")).toBe(true);
  });

  it("notifica cambios de nodo del proyecto y descarta otros proyectos", async () => {
    const onNodeChanged = vi.fn();
    renderHook(() =>
      useUmlSocket("proyecto-1", { ...emptyHandlers(), onNodeChanged }),
    );
    await waitForEffect();

    const handler = mocks.handlerRegistry.get("uml:node_added");
    expect(handler).toBeDefined();

    act(() => {
      handler!({ projectId: "proyecto-1", node: { id: "nodo-1" }, version: 2 });
      handler!({ projectId: "proyecto-otro", node: { id: "nodo-2" }, version: 1 });
    });

    expect(onNodeChanged).toHaveBeenCalledTimes(1);
    expect(onNodeChanged).toHaveBeenCalledWith({
      projectId: "proyecto-1",
      node: { id: "nodo-1" },
      version: 2,
    });
  });

  it("notifica eliminación de nodo y su limpieza de relaciones", async () => {
    const onNodeDeleted = vi.fn();
    renderHook(() =>
      useUmlSocket("proyecto-1", { ...emptyHandlers(), onNodeDeleted }),
    );
    await waitForEffect();

    const handler = mocks.handlerRegistry.get("uml:node_deleted");
    act(() => {
      handler!({
        projectId: "proyecto-1",
        nodeId: "nodo-1",
        deletedRelationIds: ["rel-1"],
        version: 3,
      });
    });

    expect(onNodeDeleted).toHaveBeenCalledWith({
      projectId: "proyecto-1",
      nodeId: "nodo-1",
      deletedRelationIds: ["rel-1"],
      version: 3,
    });
  });

  it("notifica cambios y eliminaciones de relaciones", async () => {
    const onRelationChanged = vi.fn();
    const onRelationDeleted = vi.fn();
    renderHook(() =>
      useUmlSocket("proyecto-1", {
        ...emptyHandlers(),
        onRelationChanged,
        onRelationDeleted,
      }),
    );
    await waitForEffect();

    act(() => {
      mocks.handlerRegistry
        .get("uml:relation_added")!({
          projectId: "proyecto-1",
          edge: { id: "rel-1" },
          version: 2,
        });
      mocks.handlerRegistry
        .get("uml:relation_deleted")!({
          projectId: "proyecto-1",
          edgeId: "rel-1",
          version: 3,
        });
    });

    expect(onRelationChanged).toHaveBeenCalledTimes(1);
    expect(onRelationDeleted).toHaveBeenCalledWith({
      projectId: "proyecto-1",
      edgeId: "rel-1",
      version: 3,
    });
  });

  it("notifica cuando el proyecto es eliminado y descarta otros proyectos", async () => {
    const onProjectDeleted = vi.fn();
    renderHook(() =>
      useUmlSocket("proyecto-1", {
        ...emptyHandlers(),
        onProjectDeleted,
      }),
    );
    await waitForEffect();

    const handler = mocks.handlerRegistry.get("project_deleted");
    expect(handler).toBeDefined();

    act(() => {
      handler!({ projectId: "proyecto-1" });
      handler!({ projectId: "proyecto-otro" });
    });

    expect(onProjectDeleted).toHaveBeenCalledTimes(1);
    expect(onProjectDeleted).toHaveBeenCalledWith({ projectId: "proyecto-1" });
  });

  it("limpia el socket y abandona la sala al desmontar", async () => {
    const { unmount } = renderHook(() =>
      useUmlSocket("proyecto-1", emptyHandlers()),
    );
    await waitForEffect();

    act(() => {
      unmount();
    });

    expect(mocks.leaveProjectRoom).toHaveBeenCalledWith("proyecto-1");
    expect(mocks.disconnectSocket).toHaveBeenCalled();
    expect(mocks.handlerRegistry.size).toBe(0);
  });
});

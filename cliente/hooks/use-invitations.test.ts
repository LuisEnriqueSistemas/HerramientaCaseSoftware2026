import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  INVITATION_KEYS,
  useAcceptInvitation,
  usePendingInvitations,
  useRejectInvitation,
} from "@/hooks/use-invitations";
import {
  createTestQueryClient,
  createWrapper,
} from "@/test/utils";

describe("usePendingInvitations", () => {
  it("obtiene las invitaciones pendientes", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => usePendingInvitations(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({
      id: "inv-1",
      projectName: "Catálogo",
      role: "EDITOR",
    });
  });
});

describe("useAcceptInvitation", () => {
  it("acepta la invitación y la elimina del caché", async () => {
    const queryClient = createTestQueryClient();

    const { result: pending } = renderHook(() => usePendingInvitations(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => {
      expect(pending.current.isSuccess).toBe(true);
    });

    const { result } = renderHook(() => useAcceptInvitation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("inv-1");
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData(INVITATION_KEYS.pending());
      expect(cached).toEqual([]);
    });
  });
});

describe("useRejectInvitation", () => {
  it("rechaza la invitación y la elimina del caché", async () => {
    const queryClient = createTestQueryClient();

    const { result: pending } = renderHook(() => usePendingInvitations(), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => {
      expect(pending.current.isSuccess).toBe(true);
    });

    const { result } = renderHook(() => useRejectInvitation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("inv-1");
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData(INVITATION_KEYS.pending());
      expect(cached).toEqual([]);
    });
  });
});
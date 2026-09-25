"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvitation,
  listPendingInvitations,
  rejectInvitation,
} from "@/lib/api";
import type { PendingInvitation } from "@/lib/types";
import { PROJECT_KEYS } from "./use-projects";

export const INVITATION_KEYS = {
  all: ["invitations"] as const,
  pending: () => [...INVITATION_KEYS.all, "pending"] as const,
};

export function usePendingInvitations() {
  return useQuery({
    queryKey: INVITATION_KEYS.pending(),
    queryFn: listPendingInvitations,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string): Promise<void> =>
      acceptInvitation(invitationId),
    onSuccess: (_, invitationId) => {
      queryClient.setQueryData<PendingInvitation[]>(
        INVITATION_KEYS.pending(),
        (current = []) =>
          current.filter((invitation) => invitation.id !== invitationId),
      );
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string): Promise<void> =>
      rejectInvitation(invitationId),
    onSuccess: (_, invitationId) => {
      queryClient.setQueryData<PendingInvitation[]>(
        INVITATION_KEYS.pending(),
        (current = []) =>
          current.filter((invitation) => invitation.id !== invitationId),
      );
    },
  });
}
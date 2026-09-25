"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import {
  disconnectSocket,
  getSocket,
  joinProjectRoom,
  leaveProjectRoom,
  PROJECT_SOCKET_EVENTS,
  type PermissionUpdatePayload,
  type ProjectDeletedPayload,
  type UserRemovedPayload,
} from "@/lib/socket";
import type { ProjectMemberRole } from "@/lib/types";
import { PROJECT_KEYS } from "./use-projects";

interface UseProjectSocketOptions {
  projectId: string;
  currentUserId: string;
  onUserRemoved: () => void;
  onProjectDeleted?: () => void;
}

function updateMemberRoleInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  role: ProjectMemberRole,
): void {
  const key = PROJECT_KEYS.members(projectId);
  queryClient.setQueryData(key, (current?: { userId: string; role: ProjectMemberRole }[]) =>
    current?.map((member) => ({ ...member, role })),
  );
}

export function useProjectSocket({
  projectId,
  currentUserId,
  onUserRemoved,
  onProjectDeleted,
}: UseProjectSocketOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket: Socket = getSocket();
    socket.connect();

    const handlePermissionUpdate = (payload: PermissionUpdatePayload) => {
      if (payload.projectId !== projectId) {
        return;
      }
      updateMemberRoleInCache(queryClient, projectId, payload.role);
      void queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
    };

    const handleUserRemoved = (payload: UserRemovedPayload) => {
      if (payload.projectId !== projectId) {
        return;
      }
      onUserRemoved();
    };

    const handleProjectDeleted = (payload: ProjectDeletedPayload) => {
      if (payload.projectId !== projectId) {
        return;
      }
      onProjectDeleted?.();
    };

    socket.on(PROJECT_SOCKET_EVENTS.PERMISSIONS_UPDATED, handlePermissionUpdate);
    socket.on(PROJECT_SOCKET_EVENTS.USER_REMOVED, handleUserRemoved);
    socket.on(PROJECT_SOCKET_EVENTS.PROJECT_DELETED, handleProjectDeleted);
    joinProjectRoom(projectId);

    return () => {
      socket.off(PROJECT_SOCKET_EVENTS.PERMISSIONS_UPDATED, handlePermissionUpdate);
      socket.off(PROJECT_SOCKET_EVENTS.USER_REMOVED, handleUserRemoved);
      socket.off(PROJECT_SOCKET_EVENTS.PROJECT_DELETED, handleProjectDeleted);
      leaveProjectRoom(projectId);
      disconnectSocket();
    };
  }, [projectId, currentUserId, onUserRemoved, onProjectDeleted, queryClient]);
}
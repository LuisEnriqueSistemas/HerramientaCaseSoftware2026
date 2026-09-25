"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvitation,
  createProject,
  deleteProject,
  getProject,
  listProjectMembers,
  listProjects,
  removeMember,
  updateMemberRole,
} from "@/lib/api";
import type {
  CreateProjectPayload,
  InviteMemberPayload,
  ProjectCreated,
  ProjectDetail,
  ProjectMember,
} from "@/lib/types";

export const PROJECT_KEYS = {
  all: ["projects"] as const,
  lists: () => [...PROJECT_KEYS.all, "list"] as const,
  list: () => [...PROJECT_KEYS.lists(), "all"] as const,
  detail: (projectId: string) => [...PROJECT_KEYS.all, projectId] as const,
  members: (projectId: string) =>
    [...PROJECT_KEYS.detail(projectId), "members"] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: PROJECT_KEYS.list(),
    queryFn: listProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload): Promise<ProjectCreated> =>
      createProject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string): Promise<void> => deleteProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(projectId),
    queryFn: (): Promise<ProjectDetail> => getProject(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectMembers(projectId: string, enabled = true) {
  return useQuery({
    queryKey: PROJECT_KEYS.members(projectId),
    queryFn: (): Promise<ProjectMember[]> => listProjectMembers(projectId),
    enabled: Boolean(projectId) && enabled,
  });
}

export function useInviteMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) =>
      createInvitation(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.members(projectId),
      });
    },
  });
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "editor" | "viewer" }) =>
      updateMemberRole(projectId, userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.members(projectId),
      });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.members(projectId),
      });
    },
  });
}
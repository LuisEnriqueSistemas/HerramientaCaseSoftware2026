"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCurrentUser, getCurrentUser, updateCurrentUser } from "@/lib/api";
import type { ApiUser } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

export function useProfile() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData<ApiUser>(["current-user"], user);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCurrentUser,
    onSuccess: () => {
      void queryClient.removeQueries({ queryKey: ["current-user"] });
    },
  });
}
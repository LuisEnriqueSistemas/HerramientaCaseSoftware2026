"use client";

import { useMutation } from "@tanstack/react-query";
import { loginUser, registerUser } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useRegister() {
  return useMutation({ mutationFn: registerUser });
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
    },
  });
}
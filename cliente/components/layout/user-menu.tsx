"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();

  const initial = (user?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const firstName = user?.name.split(" ")[0];

  function handleLogout() {
    clearSession();
    toast.info("Sesión cerrada.");
    router.replace("/");
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 sm:pr-3"
          aria-label="Menú de usuario"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="hidden text-sm font-medium text-zinc-900 sm:inline">
            {firstName}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-zinc-400 sm:block" aria-hidden />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-56 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg focus-visible:outline-none"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium text-zinc-900">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-zinc-100" />
          <DropdownMenu.Item asChild>
            <Link
              href="/perfil"
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none transition-colors focus:bg-zinc-100 focus:text-zinc-900"
            >
              <UserRound className="h-4 w-4" aria-hidden />
              Ver mi perfil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={handleLogout}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors focus:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
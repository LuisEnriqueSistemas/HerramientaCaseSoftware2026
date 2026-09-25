"use client";

import { Database, FolderKanban, Hammer, LayoutDashboard, Mail, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/invitaciones", label: "Invitaciones", icon: Mail },
  { href: "/perfil", label: "Mi perfil", icon: UserRound },
];

const upcomingModules = [
  { label: "Diagramas", icon: Database },
  { label: "Proyectos Spring Boot", icon: Hammer },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6">
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            Herramienta CASE
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950",
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-6 flex flex-col gap-1">
            <p className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Próximamente
            </p>
            {upcomingModules.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400"
                aria-disabled="true"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
                <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  Pronto
                </span>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-zinc-200 px-6 py-4 text-xs text-zinc-400">
          Proyecto de clase · v0.1
        </div>
      </aside>
    </>
  );
}
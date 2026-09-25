"use client";

import { ArrowRight, Database, FolderKanban, MailPlus } from "lucide-react";
import Link from "next/link";
import { usePendingInvitations } from "@/hooks/use-invitations";
import { useProjects } from "@/hooks/use-projects";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { useAuthStore } from "@/stores/auth-store";

export function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const projectsQuery = useProjects();
  const invitationsQuery = usePendingInvitations();

  const firstName = user?.name.split(" ")[0] ?? "usuario";
  const projects = projectsQuery.data ?? [];
  const pendingInvitations = invitationsQuery.data ?? [];
  const recentProjects = projects.slice(0, 3);

  const stats = [
    { label: "Proyectos", value: String(projects.length), icon: FolderKanban },
    {
      label: "Invitaciones pendientes",
      value: String(pendingInvitations.length),
      icon: MailPlus,
    },
    { label: "Diagramas", value: "0", icon: Database },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <PageHeader
          title={`Hola, ${firstName}`}
          description={
            user ? `${user.email} · Bienvenido a tu espacio de trabajo.` : undefined
          }
        >
          <CreateProjectDialog />
        </PageHeader>

        <section aria-label="Resumen de actividad" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    <Icon className="h-5 w-5 text-zinc-700" aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-base">{item.label}</CardTitle>
                    <CardDescription>{item.value} en total</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-zinc-400">
                  {item.label === "Diagramas"
                    ? "Disponible próximamente."
                    : "Actualizados en tiempo real."}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Mis proyectos</CardTitle>
            <CardDescription>
              Tus espacios de trabajo de diseño de bases de datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsQuery.isLoading ? (
              <p className="text-sm text-zinc-500">Cargando proyectos...</p>
            ) : recentProjects.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-6 py-10 text-center">
                <p className="text-sm font-medium text-zinc-700">
                  Aún no hay proyectos
                </p>
                <p className="max-w-sm text-sm text-zinc-500">
                  Crea tu primer proyecto para organizar el modelado colaborativo.
                </p>
                <Link
                  href="/proyectos"
                  className="mt-2 text-sm font-medium text-zinc-900 underline underline-offset-4"
                >
                  Ir a mis proyectos
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recentProjects.map((project) => (
                    <li key={project.id}>
                      <ProjectCard
                        id={project.id}
                        name={project.name}
                        description={project.description}
                        memberRole={project.memberRole}
                        createdAt={project.createdAt}
                      />
                    </li>
                  ))}
                </ul>
                <Button asChild type="button" variant="ghost" className="self-end">
                  <Link href="/proyectos">
                    Ver todos
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {pendingInvitations.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MailPlus className="h-4 w-4 text-zinc-500" aria-hidden />
                Invitaciones pendientes
              </CardTitle>
              <CardDescription>
                Tienes {pendingInvitations.length} invitación(es) sin responder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild type="button" variant="outline" size="sm">
                <Link href="/invitaciones">Revisar invitaciones</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
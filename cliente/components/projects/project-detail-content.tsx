"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Boxes, FolderKanban, Trash2, Users } from "lucide-react";
import { useProject, useProjectMembers } from "@/hooks/use-projects";
import { useProjectSocket } from "@/hooks/use-project-socket";
import type { ProjectMemberRole } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { InviteUserForm } from "./invite-user-form";
import { MembersPanel } from "./members-panel";

const roleLabels: Record<ProjectMemberRole, string> = {
  HOST: "Anfitrión",
  EDITOR: "Editor",
  VIEWER: "Lector",
};

const badgeVariant: Record<ProjectMemberRole, "host" | "editor" | "viewer"> = {
  HOST: "host",
  EDITOR: "editor",
  VIEWER: "viewer",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ProjectDetailContentProps {
  projectId: string;
}

export function ProjectDetailContent({ projectId }: ProjectDetailContentProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const projectQuery = useProject(projectId);
  const canViewMembersByRole =
    projectQuery.data?.memberRole === "HOST" ||
    projectQuery.data?.memberRole === "EDITOR";
  const membersQuery = useProjectMembers(projectId, Boolean(canViewMembersByRole));

  const handleUserRemoved = useCallback(() => {
    toast.error("Tu acceso a este proyecto fue revocado.");
    router.push("/dashboard");
  }, [router]);

  const handleProjectDeleted = useCallback(() => {
    toast.error("El proyecto fue eliminado por el propietario.");
    router.push("/dashboard");
  }, [router]);

  useProjectSocket({
    projectId,
    currentUserId: currentUser?.id ?? "",
    onUserRemoved: handleUserRemoved,
    onProjectDeleted: handleProjectDeleted,
  });

  if (projectQuery.isLoading) {
    return <p className="text-sm text-zinc-500">Cargando proyecto...</p>;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-zinc-600">
          No se pudo cargar el proyecto o no tienes acceso a él.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/proyectos")}
        >
          Volver a mis proyectos
        </Button>
      </div>
    );
  }

  const project = projectQuery.data;
  const actorRole = project.memberRole;
  const canManage = actorRole === "HOST";
  const canInvite = canManage;
  const canViewMembers = actorRole === "HOST" || actorRole === "EDITOR";

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/proyectos")}
            className="-ml-2 text-zinc-500"
          >
            <ArrowLeft aria-hidden />
            Mis proyectos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <FolderKanban className="h-5 w-5 text-zinc-700" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.description || "Sin descripción."}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={badgeVariant[actorRole]}>
                {roleLabels[actorRole]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500">
            Creado el {formatDate(project.createdAt)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4 text-zinc-500" aria-hidden />
              Diagrama colaborativo
            </CardTitle>
            <CardDescription>
              Abre el lienzo UML del proyecto para modelar clases y
              relaciones en tiempo real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" asChild className="gap-1.5">
              <Link href={`/proyectos/${project.id}/diagrama`}>
                <Boxes className="h-4 w-4" aria-hidden />
                Abrir diagrama
              </Link>
            </Button>
          </CardContent>
        </Card>

        {canInvite ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-zinc-500" aria-hidden />
                Invitar colaboradores
              </CardTitle>
              <CardDescription>
                Envía una invitación con rol de Editor o Lector.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteUserForm projectId={projectId} />
            </CardContent>
          </Card>
        ) : null}

        {canViewMembers ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-zinc-500" aria-hidden />
                Miembros
              </CardTitle>
              <CardDescription>
                {canManage
                  ? "Gestiona los permisos de los colaboradores del proyecto."
                  : "Colaboradores de este proyecto."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembersPanel
                projectId={projectId}
                actorRole={actorRole}
                members={membersQuery.data}
                isLoading={membersQuery.isLoading}
              />
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
            Los lectores no pueden ver la lista de miembros.
          </p>
        )}

        {canManage ? (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-600">
                <Trash2 className="h-4 w-4" aria-hidden />
                Zona de peligro
              </CardTitle>
              <CardDescription>
                Eliminar el proyecto borra permanentemente su diagrama y a
                todos sus colaboradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Eliminar proyecto
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <DeleteProjectDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          projectId={projectId}
          projectName={project.name}
          onDeleted={() => router.push("/proyectos")}
        />
      </div>
    </main>
  );
}
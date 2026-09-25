"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProjectMemberRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DeleteProjectDialog } from "./delete-project-dialog";

const roleLabels: Record<ProjectMemberRole, string> = {
  HOST: "Anfitrión",
  EDITOR: "Editor",
  VIEWER: "Lector",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  memberRole: ProjectMemberRole;
  createdAt: string;
}

export function ProjectCard({
  id,
  name,
  description,
  memberRole,
  createdAt,
}: ProjectCardProps) {
  const href = `/proyectos/${id}`;
  const canDelete = memberRole === "HOST";
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">
            <Link href={href} className="hover:underline">
              {name}
            </Link>
          </CardTitle>
          <Badge variant={memberRole.toLowerCase() as "host" | "editor" | "viewer"}>
            {roleLabels[memberRole]}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {description ?? "Sin descripción."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-400">Creado {formatDate(createdAt)}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              aria-label={`Eliminar ${name}`}
              className="h-8 w-8 text-zinc-400 hover:text-red-600"
            >
              <Trash2 aria-hidden />
            </Button>
          ) : null}
          <Link
            href={href}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Abrir
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </CardContent>
      <DeleteProjectDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectId={id}
        projectName={name}
      />
    </Card>
  );
}
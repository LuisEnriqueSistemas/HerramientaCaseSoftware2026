"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRemoveMember, useUpdateMemberRole } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import type { InviteRole, ProjectMember, ProjectMemberRole } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function roleToInviteRole(role: ProjectMemberRole): InviteRole {
  return role === "EDITOR" ? "editor" : "viewer";
}

interface MembersPanelProps {
  projectId: string;
  actorRole: ProjectMemberRole;
  members: ProjectMember[] | undefined;
  isLoading: boolean;
}

export function MembersPanel({
  projectId,
  actorRole,
  members,
  isLoading,
}: MembersPanelProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
  const canManage = actorRole === "HOST";

  const updateRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);

  async function handleRoleChange(
    member: ProjectMember,
    value: InviteRole,
  ) {
    if (value === roleToInviteRole(member.role)) {
      return;
    }
    try {
      await updateRole.mutateAsync({ userId: member.userId, role: value });
      toast.success(`Rol de ${member.name} actualizado.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleRemove() {
    if (!memberToRemove) {
      return;
    }
    try {
      await removeMember.mutateAsync(memberToRemove.userId);
      toast.success(`${memberToRemove.name} fue removido del proyecto.`);
      setMemberToRemove(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Cargando miembros...</p>;
  }

  if (!members || members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
        Aún no hay colaboradores en este proyecto.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {members.map((member) => {
          const isSelf = member.userId === currentUser?.id;
          const isProtected = member.role === "HOST";
          return (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                  {member.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                    <span className="truncate">{member.name}</span>
                    {isSelf ? (
                      <span className="text-xs text-zinc-400">(tú)</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{member.email}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {canManage && !isSelf && !isProtected ? (
                  <Select
                    value={roleToInviteRole(member.role)}
                    onValueChange={(value) =>
                      void handleRoleChange(member, value as InviteRole)
                    }
                  >
                    <SelectTrigger className="h-9 w-32" aria-label={`Rol de ${member.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Lector</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={badgeVariant[member.role]}>
                    {roleLabels[member.role]}
                  </Badge>
                )}

                {canManage && !isSelf && !isProtected ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMemberToRemove(member)}
                    aria-label={`Remover a ${member.name}`}
                    className="text-zinc-500 hover:text-red-600"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRemove(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover miembro</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas quitar a{" "}
              <span className="font-medium text-zinc-900">
                {memberToRemove?.name}
              </span>{" "}
              de este proyecto? Se cerrará su sesión activa en el mismo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberToRemove(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeMember.isPending}
              onClick={() => void handleRemove()}
            >
              {removeMember.isPending ? "Removiendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
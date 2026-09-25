"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, MailOpen, X } from "lucide-react";
import {
  useAcceptInvitation,
  usePendingInvitations,
  useRejectInvitation,
} from "@/hooks/use-invitations";
import { getApiErrorMessage } from "@/lib/api";
import type { ProjectMemberRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    month: "short",
    year: "numeric",
  });
}

export function InvitationsList() {
  const router = useRouter();
  const invitationsQuery = usePendingInvitations();
  const accept = useAcceptInvitation();
  const reject = useRejectInvitation();

  async function handleAccept(invitationId: string, projectId: string) {
    try {
      await accept.mutateAsync(invitationId);
      const invitation = invitationsQuery.data?.find(
        (item) => item.id === invitationId,
      );
      toast.success(
        `Te uniste al proyecto "${invitation?.projectName ?? ""}".`,
      );
      router.push(`/proyectos/${projectId}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleReject(invitationId: string) {
    try {
      await reject.mutateAsync(invitationId);
      toast.success("Invitación rechazada.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (invitationsQuery.isLoading) {
    return <p className="text-sm text-zinc-500">Cargando invitaciones...</p>;
  }

  const invitations = invitationsQuery.data ?? [];

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-6 py-12 text-center">
        <MailOpen className="h-8 w-8 text-zinc-300" aria-hidden />
        <p className="text-sm font-medium text-zinc-700">No tienes invitaciones</p>
        <p className="max-w-sm text-sm text-zinc-500">
          Cuando un Anfitrión te invite a un proyecto, aparecerá aquí para que la
          aceptes.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {invitations.map((invitation) => (
        <li key={invitation.id}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {invitation.projectName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Invitado como{" "}
                    <Badge variant={badgeVariant[invitation.role]} className="align-middle">
                      {roleLabels[invitation.role]}
                    </Badge>
                    <span className="ml-2 text-zinc-400">
                      · {formatDate(invitation.createdAt)}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={accept.isPending || reject.isPending}
                  onClick={() =>
                    void handleAccept(invitation.id, invitation.projectId)
                  }
                >
                  <Check aria-hidden />
                  Aceptar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={accept.isPending || reject.isPending}
                  onClick={() => void handleReject(invitation.id)}
                >
                  <X aria-hidden />
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
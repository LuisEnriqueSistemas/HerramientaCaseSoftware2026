"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { useInviteMember } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import {
  inviteMemberSchema,
  type InviteMemberFormValues,
} from "@/lib/project-schemas";
import type { InviteRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleOptions: { value: InviteRole; label: string }[] = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Lector" },
];

interface InviteUserFormProps {
  projectId: string;
}

export function InviteUserForm({ projectId }: InviteUserFormProps) {
  const invite = useInviteMember(projectId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "editor" },
  });

  async function onSubmit(values: InviteMemberFormValues) {
    try {
      await invite.mutateAsync({
        email: values.email.trim().toLowerCase(),
        role: values.role,
      });
      toast.success("Invitación enviada correctamente.");
      reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-email">Correo del invitado</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="colaborador@ejemplo.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-role">Rol</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="invite-role" aria-invalid={Boolean(errors.role)}>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.role ? (
          <p className="text-sm text-red-600">{errors.role.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={invite.isPending} className="mt-1 self-start">
        <Send aria-hidden />
        {invite.isPending ? "Enviando..." : "Enviar invitación"}
      </Button>
    </form>
  );
}
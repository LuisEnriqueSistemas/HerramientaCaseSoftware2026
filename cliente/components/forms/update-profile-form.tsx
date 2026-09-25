"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useUpdateProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api";
import type { ApiUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .optional()
      .or(z.literal("")),
    email: z.string().trim().email("El correo no es válido.").optional().or(z.literal("")),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.name || data.email || data.password, {
    message: "Completa al menos un campo para actualizar.",
  });

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export function UpdateProfileForm({ user }: { user: ApiUser }) {
  const [showPassword, setShowPassword] = useState(false);
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name, email: user.email, password: "" },
  });

  async function onSubmit(values: UpdateProfileFormValues) {
    const payload = {
      name: values.name ? values.name.trim() : undefined,
      email: values.email ? values.email.trim().toLowerCase() : undefined,
      password: values.password || undefined,
    };
    try {
      await updateProfile.mutateAsync(payload);
      toast.success("Perfil actualizado correctamente.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="update-name">Nombre</Label>
        <Input id="update-name" type="text" autoComplete="name" {...register("name")} />
        {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="update-email">Correo electrónico</Label>
        <Input
          id="update-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="update-password">
          Nueva contraseña <span className="text-xs font-normal text-zinc-400">(opcional)</span>
        </Label>
        <div className="relative">
          <Input
            id="update-password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      {errors.root ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}

      <Button type="submit" disabled={updateProfile.isPending} className="mt-2">
        {updateProfile.isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
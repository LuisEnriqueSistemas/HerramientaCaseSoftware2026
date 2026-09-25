import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar los 500 caracteres.")
    .optional(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("El correo no es válido."),
  role: z.enum(["editor", "viewer"], {
    message: "Selecciona un rol válido.",
  }),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
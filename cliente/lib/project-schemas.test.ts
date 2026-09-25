import { describe, expect, it } from "vitest";
import { createProjectSchema, inviteMemberSchema } from "@/lib/project-schemas";

describe("createProjectSchema", () => {
  it("acepta un nombre con al menos 3 caracteres y descripción opcional", () => {
    const result = createProjectSchema.safeParse({ name: "Catálogo" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Catálogo");
      expect(result.data.description).toBeUndefined();
    }
  });

  it("acepta una descripción vacía como cadena vacía", () => {
    const result = createProjectSchema.safeParse({
      name: "Catálogo",
      description: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("recorta el nombre y la descripción", () => {
    const result = createProjectSchema.safeParse({
      name: "  Ventas  ",
      description: "  Módulo principal  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ventas");
      expect(result.data.description).toBe("Módulo principal");
    }
  });

  it("rechaza un nombre vacío", () => {
    const result = createProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza un nombre de menos de 3 caracteres", () => {
    const result = createProjectSchema.safeParse({ name: "ab" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "El nombre debe tener al menos 3 caracteres.",
      );
    }
  });

  it("rechaza un nombre de más de 120 caracteres", () => {
    const result = createProjectSchema.safeParse({
      name: "x".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it("rechaza una descripción de más de 500 caracteres", () => {
    const result = createProjectSchema.safeParse({
      name: "Ventas",
      description: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("acepta un correo válido con rol editor o viewer", () => {
    expect(
      inviteMemberSchema.safeParse({ email: "ana@dominio.com", role: "editor" })
        .success,
    ).toBe(true);
    expect(
      inviteMemberSchema.safeParse({ email: "ana@dominio.com", role: "viewer" })
        .success,
    ).toBe(true);
  });

  it("rechaza un correo inválido", () => {
    const result = inviteMemberSchema.safeParse({
      email: "no-es-correo",
      role: "viewer",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El correo no es válido.");
    }
  });

  it("rechaza un rol no permitido", () => {
    const result = inviteMemberSchema.safeParse({
      email: "ana@dominio.com",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });
});
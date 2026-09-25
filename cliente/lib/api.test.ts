import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  exportProjectDiagram,
  generateSpringBootProject,
  listProjects,
  loginUser,
} from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { server } from "@/test/server";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const PROJECTS_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}/projects`;

describe("api interceptor de respuesta (sesión)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.getState().setSession("token-viejo", {
      id: "user-1",
      name: "Ana Torres",
      email: "ana@dominio.com",
    });
  });

  it("renueva el token cuando la respuesta trae x-access-token", async () => {
    server.use(
      http.get(PROJECTS_URL, () =>
        HttpResponse.json([], {
          headers: { "x-access-token": "token-renovado" },
        }),
      ),
    );

    await listProjects();

    expect(useAuthStore.getState().token).toBe("token-renovado");
  });

  it("limpia la sesión y avisa cuando un endpoint protegido devuelve 401", async () => {
    server.use(
      http.get(
        PROJECTS_URL,
        () =>
          new HttpResponse(
            JSON.stringify({ message: "Token inválido o expirado" }),
            { status: 401 },
          ),
      ),
    );

    await expect(listProjects()).rejects.toBeTruthy();

    expect(useAuthStore.getState().token).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      "Tu sesión ha caducado. Inicia sesión de nuevo.",
    );
  });

  it("no trata el 401 de /auth/login como sesión caducada", async () => {
    const authUrl = `${api.defaults.baseURL}/auth/login`;
    server.use(
      http.post(
        authUrl,
        () =>
          new HttpResponse(
            JSON.stringify({ message: "Usuario o contraseña incorrectos" }),
            { status: 401 },
          ),
      ),
    );

    await expect(
      loginUser({ email: "ana@dominio.com", password: "malaclave" }),
    ).rejects.toBeTruthy();

    expect(useAuthStore.getState().token).toBe("token-viejo");
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("exportProjectDiagram", () => {
  it("descarga el XMI del diagrama", async () => {
    server.use(
      http.get(`${PROJECTS_URL}/p-1/diagram/export`, () =>
        HttpResponse.text('<?xml version="1.0"?><xmi:XMI/>', {
          headers: { "content-type": "application/vnd.omg.xmi+xml; charset=utf-8" },
        }),
      ),
    );

    const xmi = await exportProjectDiagram("p-1", "xmi");

    const content =
      typeof xmi === "string"
        ? xmi
        : await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsText(xmi);
          });
    expect(content).toContain("<xmi:XMI/>");
  });
});

describe("generateSpringBootProject", () => {
  it("descarga el ZIP con los extras pedidos", async () => {
    let requestedUrl = "";
    server.use(
      http.get(`${PROJECTS_URL}/p-1/generate/spring-boot`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.arrayBuffer(new Uint8Array([0x50, 0x4b]).buffer, {
          headers: { "content-type": "application/octet-stream" },
        });
      }),
    );

    const zip = await generateSpringBootProject("p-1", ["validation"]);

    expect(requestedUrl).toContain("deps=validation");
    expect(zip).toBeInstanceOf(Blob);
  });
});

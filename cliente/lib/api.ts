import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import type {
  ApiAuthResponse,
  ApiUser,
  CreateProjectPayload,
  InvitationCreated,
  InviteMemberPayload,
  InviteRole,
  LoginPayload,
  PendingInvitation,
  ProjectCreated,
  ProjectDetail,
  ProjectListItem,
  ProjectMember,
  RegisterPayload,
  UpdateProfilePayload,
} from "./types";
import type { UmlDiagram } from "./uml-types";
import type { AiProviderStatus } from "./ai-types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register"];

let sessionExpiredNotified = false;

function handleSessionExpired() {
  if (sessionExpiredNotified) {
    return;
  }
  sessionExpiredNotified = true;
  useAuthStore.getState().clearSession();
  toast.error("Tu sesión ha caducado. Inicia sesión de nuevo.");
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const renewed = response.headers?.["x-access-token"];
    if (typeof renewed === "string" && renewed.length > 0) {
      useAuthStore.getState().setToken(renewed);
    }
    return response;
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const requestUrl = error.config?.url ?? "";
      const hadToken = Boolean(useAuthStore.getState().token);
      const isAuthAttempt = AUTH_ENDPOINTS.some((endpoint) =>
        requestUrl.includes(endpoint),
      );

      if (status === 401 && hadToken && !isAuthAttempt) {
        handleSessionExpired();
      }

      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text) as ApiErrorPayload;
          if (error.response) {
            (error.response as { data: unknown }).data = parsed;
          }
        } catch {
          // si no es JSON, deja el Blob original
        }
      }
    }
    return Promise.reject(error);
  },
);

interface ApiErrorPayload {
  statusCode: number;
  message: string | string[];
  error: string;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    if (Array.isArray(data?.message)) {
      return data!.message.join(", ");
    }
    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }
    return `Error de conexión (${error.response?.status ?? "sin respuesta"}).`;
  }
  return "Ocurrió un error inesperado.";
}

export async function registerUser(payload: RegisterPayload): Promise<ApiAuthResponse> {
  const { data } = await api.post<ApiAuthResponse>("/auth/register", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<ApiAuthResponse> {
  const { data } = await api.post<ApiAuthResponse>("/auth/login", payload);
  return data;
}

export async function getCurrentUser(): Promise<ApiUser> {
  const { data } = await api.get<ApiUser>("/users/me");
  return data;
}

export async function updateCurrentUser(payload: UpdateProfilePayload): Promise<ApiUser> {
  const { data } = await api.patch<ApiUser>("/users/me", payload);
  return data;
}

export async function deleteCurrentUser(): Promise<void> {
  await api.delete("/users/me");
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectCreated> {
  const { data } = await api.post<ProjectCreated>("/projects", payload);
  return data;
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const { data } = await api.get<ProjectListItem[]>("/projects");
  return data;
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const { data } = await api.get<ProjectDetail>(`/projects/${projectId}`);
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data } = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
  return data;
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: InviteRole,
): Promise<void> {
  await api.patch(`/projects/${projectId}/members/${userId}`, { role });
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

export async function createInvitation(
  projectId: string,
  payload: InviteMemberPayload,
): Promise<InvitationCreated> {
  const { data } = await api.post<InvitationCreated>(
    `/projects/${projectId}/invitations`,
    payload,
  );
  return data;
}

export async function listPendingInvitations(): Promise<PendingInvitation[]> {
  const { data } = await api.get<PendingInvitation[]>("/invitations/pending");
  return data;
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  await api.post(`/invitations/${invitationId}/accept`);
}

export async function rejectInvitation(invitationId: string): Promise<void> {
  await api.post(`/invitations/${invitationId}/reject`);
}

export async function getProjectDiagram(projectId: string): Promise<UmlDiagram> {
  const { data } = await api.get<UmlDiagram>(`/projects/${projectId}/diagram`);
  return data;
}

export type DiagramExportFormat = "ea-xmi-1.1" | "xmi" | "xsd";

export const SPRING_BOOT_OPTIONAL_DEPS = [
  "validation",
  "security",
  "actuator",
  "devtools",
  "mapstruct",
  "flyway",
] as const;

export type SpringBootExtraDep = (typeof SPRING_BOOT_OPTIONAL_DEPS)[number];

export async function exportProjectDiagram(
  projectId: string,
  format: DiagramExportFormat = "xmi",
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/projects/${projectId}/diagram/export`,
    {
      params: { format },
      responseType: "blob",
    },
  );
  return data;
}

export async function generateSpringBootProject(
  projectId: string,
  extras: SpringBootExtraDep[] = [],
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/projects/${projectId}/generate/spring-boot`,
    {
      params: extras.length > 0 ? { deps: extras.join(",") } : {},
      responseType: "blob",
    },
  );
  return data;
}

export async function generateDiagramFromPrompt(
  projectId: string,
  prompt: string,
): Promise<UmlDiagram> {
  const { data } = await api.post<UmlDiagram>(
    `/projects/${projectId}/ai/prompt`,
    { prompt },
  );
  return data;
}

export async function generateDiagramFromAudio(
  projectId: string,
  file: File,
): Promise<UmlDiagram> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UmlDiagram>(
    `/projects/${projectId}/ai/audio`,
    formData,
  );
  return data;
}

export async function transcribeAudioToText(
  projectId: string,
  audio: Blob,
): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", audio);
  const { data } = await api.post<{ text: string }>(
    `/projects/${projectId}/ai/transcribe`,
    formData,
  );
  return data;
}

export async function getAiProviderStatus(): Promise<AiProviderStatus> {
  const { data } = await api.get<AiProviderStatus>("/ai/status");
  return data;
}

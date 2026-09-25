import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth-store";

export const PROJECT_SOCKET_EVENTS = {
  PROJECT_JOINED: "project_joined",
  PERMISSIONS_UPDATED: "permissions_updated",
  USER_REMOVED: "user_removed",
  PROJECT_DELETED: "project_deleted",
} as const;

export interface PermissionUpdatePayload {
  projectId: string;
  role: "HOST" | "EDITOR" | "VIEWER";
}

export interface UserRemovedPayload {
  projectId: string;
}

export interface ProjectDeletedPayload {
  projectId: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) {
    return socket;
  }
  const token = useAuthStore.getState().token;
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinProjectRoom(projectId: string): void {
  getSocket().emit("join_project", projectId);
}

export function leaveProjectRoom(projectId: string): void {
  getSocket().emit("leave_project", projectId);
}

export const UML_SOCKET_EVENTS = {
  DIAGRAM_TYPE_UPDATED: "uml:diagram_type_updated",
  DIAGRAM_GENERATED: "uml:diagram_generated",
  NODE_ADDED: "uml:node_added",
  NODE_UPDATED: "uml:node_updated",
  NODE_DELETED: "uml:node_deleted",
  RELATION_ADDED: "uml:relation_added",
  RELATION_UPDATED: "uml:relation_updated",
  RELATION_DELETED: "uml:relation_deleted",
} as const;

export type UmlAck = { ok: true } | { ok: false; error: string };

export function emitUmlOperation(
  event: string,
  payload: unknown,
): Promise<UmlAck> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ ok: false, error: "Sin confirmación del servidor" });
    }, 6000);
    getSocket().emit(event, payload, (ack?: UmlAck) => {
      clearTimeout(timer);
      resolve(ack ?? { ok: false, error: "Sin confirmación del servidor" });
    });
  });
}

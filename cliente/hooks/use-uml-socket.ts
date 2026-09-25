"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import {
  disconnectSocket,
  getSocket,
  joinProjectRoom,
  leaveProjectRoom,
  PROJECT_SOCKET_EVENTS,
  type ProjectDeletedPayload,
  UML_SOCKET_EVENTS,
} from "@/lib/socket";
import type {
  UmlEdgeChangedPayload,
  UmlEdgeDeletedPayload,
  UmlNodeChangedPayload,
  UmlNodeDeletedPayload,
  UmlDiagramTypeChangedPayload,
} from "@/lib/uml-types";
import type { AiDiagramGeneratedPayload } from "@/lib/ai-types";

export interface UmlSocketHandlers {
  onNodeChanged: (payload: UmlNodeChangedPayload) => void;
  onNodeDeleted: (payload: UmlNodeDeletedPayload) => void;
  onRelationChanged: (payload: UmlEdgeChangedPayload) => void;
  onRelationDeleted: (payload: UmlEdgeDeletedPayload) => void;
  onDiagramGenerated: (payload: AiDiagramGeneratedPayload) => void;
  onDiagramTypeChanged: (payload: UmlDiagramTypeChangedPayload) => void;
  onProjectDeleted?: (payload: ProjectDeletedPayload) => void;
}

export function useUmlSocket(
  projectId: string,
  handlers: UmlSocketHandlers,
): void {
  const {
    onNodeChanged,
    onNodeDeleted,
    onRelationChanged,
    onRelationDeleted,
    onDiagramGenerated,
    onDiagramTypeChanged,
    onProjectDeleted,
  } =
    handlers;

  useEffect(() => {
    const socket: Socket = getSocket();
    socket.connect();

    const handleNodeAdded = (payload: UmlNodeChangedPayload) => {
      if (payload.projectId === projectId) {
        onNodeChanged(payload);
      }
    };
    const handleNodeUpdated = (payload: UmlNodeChangedPayload) => {
      if (payload.projectId === projectId) {
        onNodeChanged(payload);
      }
    };
    const handleNodeDeleted = (payload: UmlNodeDeletedPayload) => {
      if (payload.projectId === projectId) {
        onNodeDeleted(payload);
      }
    };
    const handleRelationAdded = (payload: UmlEdgeChangedPayload) => {
      if (payload.projectId === projectId) {
        onRelationChanged(payload);
      }
    };
    const handleRelationUpdated = (payload: UmlEdgeChangedPayload) => {
      if (payload.projectId === projectId) {
        onRelationChanged(payload);
      }
    };
    const handleRelationDeleted = (payload: UmlEdgeDeletedPayload) => {
      if (payload.projectId === projectId) {
        onRelationDeleted(payload);
      }
    };
    const handleDiagramGenerated = (payload: AiDiagramGeneratedPayload) => {
      if (payload.projectId === projectId) {
        onDiagramGenerated(payload);
      }
    };
    const handleDiagramTypeChanged = (payload: UmlDiagramTypeChangedPayload) => {
      if (payload.projectId === projectId) {
        onDiagramTypeChanged(payload);
      }
    };
    const handleProjectDeleted = (payload: ProjectDeletedPayload) => {
      if (payload.projectId === projectId) {
        onProjectDeleted?.(payload);
      }
    };

    socket.on(UML_SOCKET_EVENTS.NODE_ADDED, handleNodeAdded);
    socket.on(UML_SOCKET_EVENTS.NODE_UPDATED, handleNodeUpdated);
    socket.on(UML_SOCKET_EVENTS.NODE_DELETED, handleNodeDeleted);
    socket.on(UML_SOCKET_EVENTS.RELATION_ADDED, handleRelationAdded);
    socket.on(UML_SOCKET_EVENTS.RELATION_UPDATED, handleRelationUpdated);
    socket.on(UML_SOCKET_EVENTS.RELATION_DELETED, handleRelationDeleted);
    socket.on(UML_SOCKET_EVENTS.DIAGRAM_GENERATED, handleDiagramGenerated);
    socket.on(UML_SOCKET_EVENTS.DIAGRAM_TYPE_UPDATED, handleDiagramTypeChanged);
    socket.on(PROJECT_SOCKET_EVENTS.PROJECT_DELETED, handleProjectDeleted);
    joinProjectRoom(projectId);

    return () => {
      socket.off(UML_SOCKET_EVENTS.NODE_ADDED, handleNodeAdded);
      socket.off(UML_SOCKET_EVENTS.NODE_UPDATED, handleNodeUpdated);
      socket.off(UML_SOCKET_EVENTS.NODE_DELETED, handleNodeDeleted);
      socket.off(UML_SOCKET_EVENTS.RELATION_ADDED, handleRelationAdded);
      socket.off(UML_SOCKET_EVENTS.RELATION_UPDATED, handleRelationUpdated);
      socket.off(UML_SOCKET_EVENTS.RELATION_DELETED, handleRelationDeleted);
      socket.off(UML_SOCKET_EVENTS.DIAGRAM_GENERATED, handleDiagramGenerated);
      socket.off(UML_SOCKET_EVENTS.DIAGRAM_TYPE_UPDATED, handleDiagramTypeChanged);
      socket.off(PROJECT_SOCKET_EVENTS.PROJECT_DELETED, handleProjectDeleted);
      leaveProjectRoom(projectId);
      disconnectSocket();
    };
  }, [
    projectId,
    onNodeChanged,
    onNodeDeleted,
    onRelationChanged,
    onRelationDeleted,
    onDiagramGenerated,
    onDiagramTypeChanged,
    onProjectDeleted,
  ]);
}

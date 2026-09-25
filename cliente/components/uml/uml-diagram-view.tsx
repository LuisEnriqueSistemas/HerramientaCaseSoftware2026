"use client";

import "@xyflow/react/dist/style.css";

import { useQueryClient } from "@tanstack/react-query";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
} from "@xyflow/react";
import { ArrowLeft, Bot, Eye, FileDown, Loader2, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { useProject } from "@/hooks/use-projects";
import { useUmlDiagram, UML_KEYS } from "@/hooks/use-uml-diagram";
import {
  exportProjectDiagram,
  generateSpringBootProject,
  getApiErrorMessage,
  type DiagramExportFormat,
  type SpringBootExtraDep,
} from "@/lib/api";
import {
  useUmlSocket,
  type UmlSocketHandlers,
} from "@/hooks/use-uml-socket";
import {
  emitUmlOperation,
  UML_SOCKET_EVENTS,
} from "@/lib/socket";
import type {
  UmlClassAttribute,
  UmlClassMethod,
  UmlEdgeChangedPayload,
  UmlEdgeDeletedPayload,
  UmlNodeChangedPayload,
  UmlNodeDeletedPayload,
  UmlRelationKind,
  UmlDiagram,
} from "@/lib/uml-types";
import {
  flowEdgeFor,
  applyEdgePatch,
  toFlowEdge,
  toFlowEdges,
  toFlowNode,
  toFlowNodes,
  type UmlClassFlowEdge,
  type UmlClassFlowEdgeData,
  type UmlClassFlowNode,
} from "@/lib/uml-transformers";
import type { UmlEdgePatch } from "@/lib/uml-types";
import type { AiDiagramGeneratedPayload } from "@/lib/ai-types";
import { UmlEdgePropertiesPanel } from "./uml-edge-properties-panel";
import { NodePropertiesPanel } from "./node-properties-panel";
import { UmlCanvas } from "./uml-canvas";
import { UmlToolbar } from "./uml-toolbar";
import { SpringBootExportDialog } from "./spring-boot-export-dialog";
import { RelationAttributeDialog } from "./relation-attribute-dialog";
import {
  AnchorEditContext,
  type AnchorEnd,
} from "./anchor-edit-context";

interface UmlDiagramViewProps {
  projectId: string;
}

export function UmlDiagramView({ projectId }: UmlDiagramViewProps) {
  const router = useRouter();
  const projectQuery = useProject(projectId);
  const queryClient = useQueryClient();
  const diagramQuery = useUmlDiagram(projectId, Boolean(projectId));

  const [nodes, setNodes, onNodesChange] = useNodesState<UmlClassFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<UmlClassFlowEdge>([]);
  const [relationKind, setRelationKind] =
    useState<UmlRelationKind>("ASSOCIATION");
  const [manyToMany, setManyToMany] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<"properties" | "ai">("ai");
  const activeModelType = "ER_LOGICAL" as const;
  const [exporting, setExporting] = useState(false);
  const [springDialogOpen, setSpringDialogOpen] = useState(false);
  const [generatingSpring, setGeneratingSpring] = useState(false);
  const [pendingRelation, setPendingRelation] = useState<{
    source: string;
    target: string;
  } | null>(null);

  const canEdit = diagramQuery.data?.canEdit ?? false;

  useEffect(() => {
    const data = diagramQuery.data;
    if (!data) {
      return;
    }
    setNodes(toFlowNodes(data.nodes, "ER_LOGICAL"));
    setEdges(toFlowEdges(data.edges));
  }, [diagramQuery.data, setEdges, setNodes]);

  const resync = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: UML_KEYS.diagram(projectId),
    });
  }, [projectId, queryClient]);

  const reportFailure = useCallback(
    (error: string) => {
      toast.error(error);
      resync();
    },
    [resync],
  );

  const applyRemoteNode = useCallback(
    (payload: UmlNodeChangedPayload) => {
      const incoming = toFlowNode(payload.node, "ER_LOGICAL");
      setNodes((current) =>
        current.some((node) => node.id === incoming.id)
          ? current.map((node) =>
              node.id === incoming.id
                ? {
                    ...incoming,
                    position: incoming.position,
                    width: node.width ?? incoming.width,
                    height: node.height ?? incoming.height,
                    style: node.style ?? incoming.style,
                    data: incoming.data,
                  }
                : node,
            )
          : [...current, incoming],
      );
    },
    [setNodes],
  );

  const applyRemoteDiagramType = useCallback(
    (payload: { projectId: string; modelType: "CLASS" | "ER_LOGICAL" }) => {
      void payload;
      queryClient.setQueryData(
        UML_KEYS.diagram(projectId),
        (current: UmlDiagram | undefined) =>
          current ? { ...current, modelType: "ER_LOGICAL" } : current,
      );
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          data: { ...node.data, modelType: "ER_LOGICAL" },
        })),
      );
    },
    [projectId, queryClient, setNodes],
  );

  const applyRemoteNodeDeleted = useCallback(
    (payload: UmlNodeDeletedPayload) => {
      setNodes((current) =>
        current.filter((node) => node.id !== payload.nodeId),
      );
      if (payload.deletedRelationIds.length > 0) {
        setEdges((current) =>
          current.filter(
            (edge) => !payload.deletedRelationIds.includes(edge.id),
          ),
        );
      }
    },
    [setEdges, setNodes],
  );

  const applyRemoteEdge = useCallback(
    (payload: UmlEdgeChangedPayload) => {
      const incoming = toFlowEdge(payload.edge);
      setEdges((current) =>
        current.some((edge) => edge.id === incoming.id)
          ? current.map((edge) => (edge.id === incoming.id ? incoming : edge))
          : [...current, incoming],
      );
    },
    [setEdges],
  );

  const applyRemoteEdgeDeleted = useCallback(
    (payload: UmlEdgeDeletedPayload) => {
      setEdges((current) =>
        current.filter((edge) => edge.id !== payload.edgeId),
      );
    },
    [setEdges],
  );

  const applyGeneratedDiagram = useCallback(
    (payload: AiDiagramGeneratedPayload) => {
      queryClient.setQueryData(UML_KEYS.diagram(projectId), payload.diagram);
       setNodes(toFlowNodes(payload.diagram.nodes, "ER_LOGICAL"));
      setEdges(toFlowEdges(payload.diagram.edges));
    },
    [projectId, queryClient, setEdges, setNodes],
  );

  const socketHandlers: UmlSocketHandlers = useMemo(
    () => ({
      onNodeChanged: applyRemoteNode,
      onNodeDeleted: applyRemoteNodeDeleted,
      onRelationChanged: applyRemoteEdge,
      onRelationDeleted: applyRemoteEdgeDeleted,
      onDiagramGenerated: applyGeneratedDiagram,
      onDiagramTypeChanged: applyRemoteDiagramType,
      onProjectDeleted: () => {
        toast.error("El proyecto fue eliminado por el propietario.");
        void router.push("/dashboard");
      },
    }),
    [
      applyGeneratedDiagram,
      applyRemoteDiagramType,
      applyRemoteEdge,
      applyRemoteEdgeDeleted,
      applyRemoteNode,
      applyRemoteNodeDeleted,
      router,
    ],
  );

  useUmlSocket(projectId, socketHandlers);

  const handleAddClass = useCallback(() => {
    if (!canEdit) {
      return;
    }
    const id = crypto.randomUUID();
    const x = 120 + Math.round(Math.random() * 160);
    const y = 120 + Math.round(Math.random() * 160);
    const flowNode = toFlowNode({
      id,
       name: "nueva_tabla",
      x,
      y,
      attributes: [],
      methods: [],
      updatedAt: new Date().toISOString(),
     }, "ER_LOGICAL");
    setNodes((current) => [...current, flowNode]);
    setSelectedNodeId(id);
    void emitUmlOperation(UML_SOCKET_EVENTS.NODE_ADDED, {
      projectId,
      node: {
        id,
         name: "nueva_tabla",
        x,
        y,
        attributes: [],
        methods: [],
      },
    }).then((ack) => {
      if (!ack.ok) {
        reportFailure(ack.error);
      }
    });
  }, [canEdit, projectId, reportFailure, setNodes]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!canEdit || !connection.source || !connection.target) {
        return;
      }
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      if (!sourceNode || !targetNode) return;

      const targetUniques = targetNode.data.attributes;
      if (targetUniques.length === 0) {
        toast.error("La tabla destino no tiene atributos para relacionar");
        return;
      }
      if (sourceNode.data.attributes.length === 0) {
        toast.error("La tabla origen no tiene atributos para referenciar");
        return;
      }

      setPendingRelation({ source: connection.source, target: connection.target });
    },
    [canEdit, nodes],
  );

  const handleConfirmRelation = useCallback(
    (sourceAttributeId: string, targetAttributeId: string) => {
      if (!pendingRelation || !canEdit) {
        return;
      }
      const sourceNode = nodes.find((n) => n.id === pendingRelation.source);
      const targetNode = nodes.find((n) => n.id === pendingRelation.target);
      if (!sourceNode || !targetNode) {
        setPendingRelation(null);
        return;
      }
      const targetAttr = targetNode.data.attributes.find((a) => a.id === targetAttributeId);
      if (!targetAttr) {
        toast.error("Atributo destino no encontrado");
        return;
      }

      const sourceMin = 1;
      const sourceMax: number | null = 1;
      const targetMin = 0;
      const targetMax: number | null = null;

      if (manyToMany) {
        const sourceKeys = sourceNode.data.attributes.filter((a) => a.keyType === "PK");
        const targetKeys = targetNode.data.attributes.filter((a) => a.keyType === "PK");
        if (sourceKeys.length === 0 || targetKeys.length === 0) {
          toast.error("Ambas tablas deben tener una PK antes de crear una relación N:M");
          setPendingRelation(null);
          return;
        }
        const bridgeId = crypto.randomUUID();
        const bridgeName = `${sourceNode.data.name}_${targetNode.data.name}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 120);
        const bridgeAttributes = [...sourceKeys, ...targetKeys].map((a) => ({
          ...a,
          id: crypto.randomUUID(),
          keyType: "PK" as const,
          isCompositeKey: true,
          nullable: false,
          referencesEntityId: null,
          referencesAttributeId: null,
        }));
        const bridgeNode = toFlowNode(
          {
            id: bridgeId,
            name: bridgeName,
            x: (sourceNode.position.x + targetNode.position.x) / 2,
            y: (sourceNode.position.y + targetNode.position.y) / 2 + 180,
            attributes: bridgeAttributes,
            methods: [],
            updatedAt: new Date().toISOString(),
          },
          "ER_LOGICAL",
        );
        const bridgeEdges = [
          flowEdgeFor({ id: crypto.randomUUID(), type: "ASSOCIATION", source: bridgeId, target: sourceNode.id, sourceMin: 0, sourceMax: null, targetMin: 1, targetMax: 1 }),
          flowEdgeFor({ id: crypto.randomUUID(), type: "ASSOCIATION", source: bridgeId, target: targetNode.id, sourceMin: 0, sourceMax: null, targetMin: 1, targetMax: 1 }),
        ];
        setNodes((current) => [...current, bridgeNode]);
        setEdges((current) => [...current, ...bridgeEdges]);
        setPendingRelation(null);
        void (async () => {
          const nodeAck = await emitUmlOperation(UML_SOCKET_EVENTS.NODE_ADDED, {
            projectId,
            node: { id: bridgeId, name: bridgeName, x: bridgeNode.position.x, y: bridgeNode.position.y, attributes: bridgeAttributes, methods: [] },
          });
          if (!nodeAck.ok) {
            reportFailure(nodeAck.error);
            return;
          }
          for (const edge of bridgeEdges) {
            const edgeAck = await emitUmlOperation(UML_SOCKET_EVENTS.RELATION_ADDED, {
              projectId,
              edge: { id: edge.id, sourceId: edge.source, targetId: edge.target, type: "ASSOCIATION", sourceMin: edge.data?.sourceMin ?? 0, sourceMax: edge.data?.sourceMax ?? null, targetMin: edge.data?.targetMin ?? 1, targetMax: edge.data?.targetMax ?? 1 },
            });
            if (!edgeAck.ok) {
              reportFailure(edgeAck.error);
              return;
            }
          }
          resync();
        })();
        return;
      }

      const sourceAttr = sourceNode.data.attributes.find((a) => a.id === sourceAttributeId);
      if (!sourceAttr) {
        toast.error("Atributo origen no encontrado");
        return;
      }

      const updatedAttributes = sourceNode.data.attributes.map((a) =>
        a.id === sourceAttributeId
          ? {
              ...a,
              keyType: "FK" as const,
              referencesEntityId: targetNode.id,
              referencesAttributeId: targetAttributeId,
              nullable: targetMin === 0,
            }
          : a,
      );

      setNodes((current) =>
        current.map((n) =>
          n.id === sourceNode.id ? { ...n, data: { ...n.data, attributes: updatedAttributes } } : n,
        ),
      );

      const edge = flowEdgeFor({
        id: crypto.randomUUID(),
        type: relationKind,
        source: pendingRelation.source,
        target: pendingRelation.target,
        sourceMin,
        sourceMax,
        targetMin,
        targetMax,
      });
      setEdges((current) => addEdge(edge, current));
      setPendingRelation(null);

      void emitUmlOperation(UML_SOCKET_EVENTS.NODE_UPDATED, {
        projectId,
        nodeId: sourceNode.id,
        patch: { attributes: updatedAttributes },
      }).then((ack) => {
        if (!ack.ok) {
          reportFailure(ack.error);
          return;
        }
        void emitUmlOperation(UML_SOCKET_EVENTS.RELATION_ADDED, {
          projectId,
          edge: {
            id: edge.id,
            sourceId: edge.source,
            targetId: edge.target,
            type: relationKind,
            sourceMin,
            sourceMax,
            targetMin,
            targetMax,
          },
        }).then((edgeAck) => {
          if (!edgeAck.ok) reportFailure(edgeAck.error);
          else resync();
        });
      });
    },
    [canEdit, manyToMany, nodes, pendingRelation, projectId, relationKind, reportFailure, resync, setEdges, setNodes],
  );

  const handleNodeDragStop = useCallback(
    (node: UmlClassFlowNode) => {
      if (!canEdit) {
        return;
      }
      void emitUmlOperation(UML_SOCKET_EVENTS.NODE_UPDATED, {
        projectId,
        nodeId: node.id,
        patch: { x: node.position.x, y: node.position.y },
      }).then((ack) => {
        if (!ack.ok) {
          reportFailure(ack.error);
        }
      });
    },
    [canEdit, projectId, reportFailure],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!canEdit) {
        return;
      }
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      );
      setSelectedNodeId(null);
      void emitUmlOperation(UML_SOCKET_EVENTS.NODE_DELETED, {
        projectId,
        nodeId,
      }).then((ack) => {
        if (!ack.ok) {
          reportFailure(ack.error);
        } else {
          resync();
        }
      });
    },
    [canEdit, projectId, reportFailure, resync, setEdges, setNodes],
  );

  const handleNodesDelete = useCallback(
    (deleted: UmlClassFlowNode[]) => {
      for (const node of deleted) {
        handleDeleteNode(node.id);
      }
    },
    [handleDeleteNode],
  );

  const handleEdgesDelete = useCallback(
    (deleted: UmlClassFlowEdge[]) => {
      if (!canEdit) {
        return;
      }
      for (const edge of deleted) {
        void emitUmlOperation(UML_SOCKET_EVENTS.RELATION_DELETED, {
          projectId,
          edgeId: edge.id,
        }).then((ack) => {
          if (!ack.ok) {
            reportFailure(ack.error);
          } else {
            resync();
          }
        });
      }
    },
    [canEdit, projectId, reportFailure, resync],
  );

  const handleNodeClick = useCallback((node: UmlClassFlowNode) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setActiveSidePanel("properties");
  }, []);

  const handleEdgeClick = useCallback((edge: UmlClassFlowEdge) => {
    setSelectedNodeId(null);
    setSelectedEdgeId(edge.id);
    setActiveSidePanel("properties");
  }, []);

  const handleEdgeUpdate = useCallback(
    (edgeId: string, patch: UmlEdgePatch) => {
      if (!canEdit) {
        return;
      }
      setEdges((current) =>
        current.map((edge) =>
          edge.id === edgeId ? applyEdgePatch(edge, patch) : edge,
        ),
      );
      void emitUmlOperation(UML_SOCKET_EVENTS.RELATION_UPDATED, {
        projectId,
        edgeId,
        patch,
      }).then((ack) => {
        if (!ack.ok) {
          reportFailure(ack.error);
        } else {
          resync();
        }
      });
    },
    [canEdit, projectId, reportFailure, resync, setEdges],
  );

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      if (!canEdit) {
        return;
      }
      setEdges((current) => current.filter((edge) => edge.id !== edgeId));
      setSelectedEdgeId(null);
      void emitUmlOperation(UML_SOCKET_EVENTS.RELATION_DELETED, {
        projectId,
        edgeId,
      }).then((ack) => {
        if (!ack.ok) {
          reportFailure(ack.error);
        } else {
          resync();
        }
      });
    },
    [canEdit, projectId, reportFailure, resync, setEdges],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const handleExport = useCallback(async (format: DiagramExportFormat) => {
    if (!diagramQuery.data) {
      return;
    }
    setExporting(true);
    try {
      const blob = await exportProjectDiagram(projectId, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = format === "ea-xmi-1.1" ? "ea.xmi" : format;
      link.download = `modelo-${projectId}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Diagrama exportado como ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }, [diagramQuery.data, projectId]);

  const handleGenerateSpringBoot = useCallback(
    async (extras: SpringBootExtraDep[]) => {
      if (!diagramQuery.data) {
        return;
      }
      setGeneratingSpring(true);
      try {
        const blob = await generateSpringBootProject(projectId, extras);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `spring-boot-${projectId}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setSpringDialogOpen(false);
        toast.success("Proyecto Spring Boot generado");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setGeneratingSpring(false);
      }
    },
    [diagramQuery.data, projectId],
  );

  const handlePatchNode = useCallback(
    (
      nodeId: string,
      patch: {
        name?: string;
        tableName?: string;
        description?: string | null;
        attributes?: UmlClassAttribute[];
        methods?: UmlClassMethod[];
      },
    ) => {
      if (!canEdit) {
        return;
      }
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node,
        ),
      );
      void emitUmlOperation(UML_SOCKET_EVENTS.NODE_UPDATED, {
        projectId,
        nodeId,
        patch,
      }).then((ack) => {
        if (!ack.ok) {
          reportFailure(ack.error);
        }
      });
    },
    [canEdit, projectId, reportFailure, setNodes],
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId),
    [edges, selectedEdgeId],
  );

  const [pendingAnchors, setPendingAnchors] = useState<
    Record<string, { source?: number; target?: number }>
  >({});

  const edgesForRender: UmlClassFlowEdge[] = useMemo(
    () =>
      edges.map((edge): UmlClassFlowEdge => {
        const pending = pendingAnchors[edge.id];
        if (!pending) {
          return edge;
        }
        const current = edge.data;
        const data: UmlClassFlowEdgeData = {
          type: current?.type ?? "ASSOCIATION",
          sourceMin: current?.sourceMin ?? 1,
          sourceMax: current?.sourceMax ?? null,
          targetMin: current?.targetMin ?? 1,
          targetMax: current?.targetMax ?? null,
          sourceRole: current?.sourceRole ?? null,
          targetRole: current?.targetRole ?? null,
          sourceAnchor:
            pending.source !== undefined
              ? { angle: pending.source }
              : (current?.sourceAnchor ?? null),
          targetAnchor:
            pending.target !== undefined
              ? { angle: pending.target }
              : (current?.targetAnchor ?? null),
        };
        return { ...edge, data };
      }),
    [edges, pendingAnchors],
  );

  const nodesWithGlow = useMemo(() => {
    if (!selectedEdgeId) {
      return nodes;
    }
    const active = edgesForRender.find((edge) => edge.id === selectedEdgeId);
    if (!active) {
      return nodes;
    }
    return nodes.map((node) =>
      node.id === active.source || node.id === active.target
        ? { ...node, className: "neon-glow" }
        : node,
    );
  }, [edgesForRender, nodes, selectedEdgeId]);

  const clearPendingAnchor = useCallback((edgeId: string) => {
    setPendingAnchors((current) => {
      if (!(edgeId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[edgeId];
      return next;
    });
  }, []);

  const onAnchorPreview = useCallback(
    (edgeId: string, end: AnchorEnd, angle: number) => {
      setPendingAnchors((current) => ({
        ...current,
        [edgeId]: { ...current[edgeId], [end]: angle },
      }));
    },
    [],
  );

  const onAnchorCommit = useCallback(
    (edgeId: string, end: AnchorEnd, angle: number) => {
      if (!canEdit) {
        return;
      }
      void emitUmlOperation(UML_SOCKET_EVENTS.RELATION_UPDATED, {
        projectId,
        edgeId,
        patch: {
          ...(end === "source"
            ? { sourceAnchor: { angle } }
            : { targetAnchor: { angle } }),
        },
      }).then((ack) => {
        clearPendingAnchor(edgeId);
        if (!ack.ok) {
          reportFailure(ack.error);
        } else {
          resync();
        }
      });
    },
    [canEdit, clearPendingAnchor, projectId, reportFailure, resync],
  );

  const anchorEditValue = useMemo(
    () => ({
      selectedEdgeId,
      canEdit,
      onAnchorPreview,
      onAnchorCommit,
    }),
    [canEdit, onAnchorCommit, onAnchorPreview, selectedEdgeId],
  );

  if (diagramQuery.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Cargando diagrama...
      </main>
    );
  }

  if (diagramQuery.isError || !diagramQuery.data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-sm text-zinc-600">
          No se pudo cargar el diagrama o no tienes acceso a este proyecto.
        </p>
        <Button type="button" variant="outline" asChild>
          <Link href={`/proyectos/${projectId}`}>
            <ArrowLeft aria-hidden />
            Volver al proyecto
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-3 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link
                href={`/proyectos/${projectId}`}
                className="-ml-2 shrink-0 gap-1.5 text-zinc-500"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Volver
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
                {projectQuery.data?.name ?? "Diagrama UML"}
              </h1>
            </div>
            <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
              ER lógico
            </Badge>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <UmlToolbar
              canEdit={canEdit}
              relationKind={relationKind}
              onRelationKindChange={setRelationKind}
              manyToMany={manyToMany}
              onManyToManyChange={setManyToMany}
              onAddClass={handleAddClass}
            />
            <Select
              disabled={exporting}
              onValueChange={(value) => {
                if (value === "ea-xmi-1.1" || value === "xsd") {
                  void handleExport(value);
                } else if (value === "spring-boot") {
                  setSpringDialogOpen(true);
                }
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-[112px] gap-1.5 text-xs">
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <FileDown className="h-4 w-4" aria-hidden />
                )}
                <SelectValue placeholder="Exportar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ea-xmi-1.1">EA XMI 1.1</SelectItem>
                <SelectItem value="xsd">XSD</SelectItem>
                <SelectItem value="spring-boot">Spring Boot</SelectItem>
              </SelectContent>
            </Select>
            <SpringBootExportDialog
              open={springDialogOpen}
              generating={generatingSpring}
              onOpenChange={setSpringDialogOpen}
              onGenerate={(extras) => void handleGenerateSpringBoot(extras)}
            />
            {canEdit ? (
              <Badge variant="editor" className="hidden sm:inline-flex">
                Edición colaborativa
              </Badge>
            ) : (
              <Badge variant="viewer" className="gap-1">
                <Eye className="h-3 w-3" aria-hidden />
                Solo lectura
              </Badge>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-stretch gap-3 lg:flex-row">
          <div className="min-h-[560px] flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <AnchorEditContext.Provider value={anchorEditValue}>
              <UmlCanvas
                nodes={nodesWithGlow}
                edges={edgesForRender}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                canEdit={canEdit}
                onConnect={handleConnect}
                onNodeDragStop={handleNodeDragStop}
                onNodesDelete={handleNodesDelete}
                onEdgesDelete={handleEdgesDelete}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onPaneClick={handlePaneClick}
              />
            </AnchorEditContext.Provider>
          </div>
          <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden lg:w-80">
            <div className="flex rounded-t-lg border border-b-0 border-zinc-200 bg-zinc-50 p-1">
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium ${
                  activeSidePanel === "properties"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                onClick={() => setActiveSidePanel("properties")}
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
                Propiedades
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium ${
                  activeSidePanel === "ai"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                onClick={() => setActiveSidePanel("ai")}
              >
                <Bot className="h-3.5 w-3.5" aria-hidden />
                Asistencia IA
              </button>
            </div>
            {activeSidePanel === "ai" ? (
              <AiAssistantPanel
                projectId={projectId}
                canEdit={canEdit}
                onGenerated={(diagram) =>
                  applyGeneratedDiagram({ projectId, diagram })
                }
              />
            ) : selectedEdge ? (
              <UmlEdgePropertiesPanel
                key={selectedEdge.id}
                canEdit={canEdit}
                edge={selectedEdge}
                nodes={nodes}
                onUpdate={handleEdgeUpdate}
                onDelete={handleEdgeDelete}
                onClose={handlePaneClick}
              />
            ) : (
              <NodePropertiesPanel
                key={selectedNodeId ?? "sin-seleccion"}
                canEdit={canEdit}
                node={selectedNode}
                onPatch={handlePatchNode}
              onDelete={handleDeleteNode}
                onClose={handlePaneClick}
                modelType={activeModelType}
                availableNodes={nodes}
              />
            )}
          </aside>
        </div>
      </div>
      <RelationAttributeDialog
        open={pendingRelation !== null}
        sourceNode={pendingRelation ? nodes.find((n) => n.id === pendingRelation.source) : undefined}
        targetNode={pendingRelation ? nodes.find((n) => n.id === pendingRelation.target) : undefined}
        onOpenChange={(open) => {
          if (!open) setPendingRelation(null);
        }}
        onConfirm={handleConfirmRelation}
      />
    </main>
  );
}

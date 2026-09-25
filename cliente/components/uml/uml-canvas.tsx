"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import type {
  UmlClassFlowEdge,
  UmlClassFlowNode,
} from "@/lib/uml-transformers";
import { UmlClassNodeComponent } from "./uml-class-node";
import { UmlEdge } from "./uml-edge";

const nodeTypes: NodeTypes = {
  umlClass: UmlClassNodeComponent,
};

const edgeTypes: EdgeTypes = {
  uml: UmlEdge,
};

interface UmlCanvasProps {
  nodes: UmlClassFlowNode[];
  edges: UmlClassFlowEdge[];
  onNodesChange: OnNodesChange<UmlClassFlowNode>;
  onEdgesChange: OnEdgesChange<UmlClassFlowEdge>;
  canEdit: boolean;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: (node: UmlClassFlowNode) => void;
  onNodesDelete: (nodes: UmlClassFlowNode[]) => void;
  onEdgesDelete: (edges: UmlClassFlowEdge[]) => void;
  onNodeClick: (node: UmlClassFlowNode) => void;
  onEdgeClick: (edge: UmlClassFlowEdge) => void;
  onPaneClick: () => void;
}

export function UmlCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  canEdit,
  onConnect,
  onNodeDragStop,
  onNodesDelete,
  onEdgesDelete,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
}: UmlCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={(_, node) => onNodeDragStop(node as UmlClassFlowNode)}
      onNodesDelete={(deleted) => onNodesDelete(deleted as UmlClassFlowNode[])}
      onEdgesDelete={(deleted) => onEdgesDelete(deleted as UmlClassFlowEdge[])}
      onNodeClick={(_, node) => onNodeClick(node as UmlClassFlowNode)}
      onEdgeClick={(_, edge) => onEdgeClick(edge as UmlClassFlowEdge)}
      onPaneClick={onPaneClick}
      nodesDraggable={canEdit}
      nodesConnectable={canEdit}
      deleteKeyCode={canEdit ? "Backspace" : null}
      proOptions={{ hideAttribution: true }}
      fitView
      className="h-full bg-zinc-50"
      minZoom={0.2}
      maxZoom={2}
    >
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0" width="0" height="0">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 16 16"
            refX="14"
            refY="8"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path
              d="M 2 2 L 14 8 L 2 14"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
            />
          </marker>
          <marker
            id="triangle"
            viewBox="0 0 16 16"
            refX="14"
            refY="8"
            markerWidth="14"
            markerHeight="14"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path
              d="M 2 2 L 14 8 L 2 14 Z"
              fill="#fff"
              stroke="#000"
              strokeWidth="1.5"
            />
          </marker>
          <marker
            id="diamond"
            viewBox="0 0 20 20"
            refX="18"
            refY="10"
            markerWidth="14"
            markerHeight="14"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path
              d="M 10 2 L 18 10 L 10 18 L 2 10 Z"
              fill="#fff"
              stroke="#000"
              strokeWidth="1.5"
            />
          </marker>
          <marker
            id="diamond-filled"
            viewBox="0 0 20 20"
            refX="18"
            refY="10"
            markerWidth="14"
            markerHeight="14"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path
              d="M 10 2 L 18 10 L 10 18 L 2 10 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="1.5"
            />
          </marker>
        </defs>
      </svg>
      <Background
        variant={BackgroundVariant.Dots}
        gap={18}
        size={1.5}
        color="#d4d4d8"
      />
      <Controls className="!border-zinc-200 !bg-white !text-zinc-700" />
      <MiniMap
        pannable
        zoomable
        className="!border !border-zinc-200"
        nodeColor="#a1a1aa"
        maskColor="rgba(24, 24, 27, 0.08)"
      />
    </ReactFlow>
  );
}

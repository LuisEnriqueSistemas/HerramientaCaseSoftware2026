"use client";

import { useMemo } from "react";
import {
  Handle,
  Position,
  useEdges,
  useNodeConnections,
  useNodes,
  type NodeProps,
} from "@xyflow/react";
import type { UmlClassNode, UmlVisibility } from "@/lib/uml-types";
import {
  angleBucket,
  cardinalityLabelPosition,
  centeredStackOffsets,
  nodeBoxOf,
  resolveCardinalitySide,
  type CardinalitySide,
  type NodeBox,
} from "@/lib/cardinality-layout";
import {
  formatMultiplicity,
  UML_NODE_HEIGHT,
  UML_NODE_WIDTH,
  type UmlClassFlowEdge,
  type UmlClassFlowNode,
} from "@/lib/uml-transformers";
import { AnchorHandle } from "./anchor-handle";
import {
  useAnchorEdit,
  type AnchorEnd,
} from "./anchor-edit-context";
import { CardinalityLabel } from "./cardinality-label";

export const VISIBILITY_SYMBOL: Record<UmlVisibility, string> = {
  public: "+",
  private: "-",
  protected: "#",
};

export const VISIBILITY_LABEL: Record<UmlVisibility, string> = {
  public: "publico",
  private: "privado",
  protected: "protegido",
};

function attributeLine(visibility: UmlVisibility, name: string, type: string) {
  return `${VISIBILITY_SYMBOL[visibility]} ${name}: ${type}`;
}

function erAttributeLine(attribute: UmlClassNode["attributes"][number]) {
  const key = attribute.keyType === "PK" ? "🔑" : attribute.keyType === "FK" ? "🔗" : "  ";
  const nullable = attribute.nullable === false ? " NOT NULL" : "";
  return `${key} ${attribute.name}: ${attribute.type}${nullable}`;
}

function methodLine(
  visibility: UmlVisibility,
  name: string,
  parameters: string,
  returnType: string,
) {
  return `${VISIBILITY_SYMBOL[visibility]} ${name}(${parameters}): ${returnType}`;
}

interface NodeCardinality {
  key: string;
  value: string;
  side: CardinalitySide;
  offset: number;
  position: { x: number; y: number } | null;
}

interface NodeAnchorHandle {
  key: string;
  edgeId: string;
  end: AnchorEnd;
  angle: number;
}

export function UmlClassNodeComponent({
  id,
  data,
  selected,
}: NodeProps<UmlClassFlowNode>) {
  const connections = useNodeConnections({ id });
  const flowNodes = useNodes<UmlClassFlowNode>();
  const flowEdges = useEdges<UmlClassFlowEdge>();
  const { selectedEdgeId, canEdit, onAnchorPreview, onAnchorCommit } =
    useAnchorEdit();

  const selfBox: NodeBox | null = useMemo(() => {
    const self = flowNodes.find((node) => node.id === id);
    return self ? nodeBoxOf(self) : null;
  }, [flowNodes, id]);

  const cardinalities = useMemo<NodeCardinality[]>(() => {
    if (!selfBox) {
      return [];
    }
    const edgesById = new Map(flowEdges.map((edge) => [edge.id, edge]));
    const items: Array<
      Omit<NodeCardinality, "offset" | "position"> & { angle: number | null }
    > = [];
    for (const connection of connections) {
      const edgeData = edgesById.get(connection.edgeId)?.data;
      if (!edgeData) {
        continue;
      }
      const isSource = connection.source === id;
      const neighborId = isSource ? connection.target : connection.source;
      const neighbor = flowNodes.find((node) => node.id === neighborId);
      if (!neighbor) {
        continue;
      }
      const rawAngle = isSource
        ? edgeData.sourceAnchor?.angle
        : edgeData.targetAnchor?.angle;
      const angle =
        typeof rawAngle === "number" && Number.isFinite(rawAngle)
          ? rawAngle
          : null;
      items.push({
        key: `${connection.edgeId}:${isSource ? "source" : "target"}`,
        value: formatMultiplicity(
          isSource ? edgeData.sourceMin : edgeData.targetMin,
          isSource ? edgeData.sourceMax : edgeData.targetMax,
        ),
        side: resolveCardinalitySide(
          selfBox.position.x,
          selfBox.position.y,
          neighbor.position.x,
          neighbor.position.y,
        ),
        angle,
      });
    }
    const withAngle = items.filter(
      (item): item is typeof item & { angle: number } =>
        item.angle !== null,
    );
    const withoutAngle = items.filter((item) => item.angle === null);
    const labeled: NodeCardinality[] = [];
    const byBucket = new Map<number, typeof withAngle>();
    for (const item of withAngle) {
      const bucket = angleBucket(item.angle);
      const group = byBucket.get(bucket) ?? [];
      group.push(item);
      byBucket.set(bucket, group);
    }
    for (const group of byBucket.values()) {
      group.forEach((item, stackIndex) => {
        const point = cardinalityLabelPosition(
          selfBox,
          item.angle,
          stackIndex,
        );
        labeled.push({
          ...item,
          offset: 0,
          position: {
            x: point.x - selfBox.position.x,
            y: point.y - selfBox.position.y,
          },
        });
      });
    }
    const bySide = new Map<CardinalitySide, typeof withoutAngle>();
    for (const item of withoutAngle) {
      const group = bySide.get(item.side) ?? [];
      group.push(item);
      bySide.set(item.side, group);
    }
    for (const group of bySide.values()) {
      const offsets = centeredStackOffsets(group.length);
      group.forEach((item, index) => {
        labeled.push({ ...item, offset: offsets[index] ?? 0, position: null });
      });
    }
    return labeled;
  }, [connections, flowEdges, flowNodes, id, selfBox]);

  const anchorHandles = useMemo<NodeAnchorHandle[]>(() => {
    if (!canEdit || !selectedEdgeId) {
      return [];
    }
    const handles: NodeAnchorHandle[] = [];
    for (const connection of connections) {
      if (connection.edgeId !== selectedEdgeId) {
        continue;
      }
      const edgeData = flowEdges
        .find((edge) => edge.id === connection.edgeId)
        ?.data;
      if (!edgeData) {
        continue;
      }
      const isSource = connection.source === id;
      const rawAngle = isSource
        ? edgeData.sourceAnchor?.angle
        : edgeData.targetAnchor?.angle;
      handles.push({
        key: `${connection.edgeId}:${isSource ? "source" : "target"}`,
        edgeId: connection.edgeId,
        end: isSource ? "source" : "target",
        angle:
          typeof rawAngle === "number" && Number.isFinite(rawAngle)
            ? rawAngle
            : 0,
      });
    }
    return handles;
  }, [canEdit, connections, flowEdges, id, selectedEdgeId]);

  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-white shadow-sm ${
        selected ? "border-zinc-700" : "border-zinc-300"
      }`}
      style={{ width: UML_NODE_WIDTH, height: UML_NODE_HEIGHT }}
    >
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((position) => (
        <Handle
          key={`target-${position}`}
          type="target"
          position={position}
          id={`target-${position}`}
          className="!size-2.5 !border-2 !border-white !bg-zinc-400"
        />
      ))}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
      <div className="shrink-0 truncate border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-sm font-semibold leading-snug text-zinc-800">
        {data.name}
      </div>
      <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-200">
        <div className="shrink-0 px-3 pt-1 text-[11px] uppercase tracking-wide text-zinc-500">
          Atributos
        </div>
        <ul className="uml-class-node__list nodrag nowheel min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 font-mono text-xs leading-relaxed text-zinc-700">
          {data.attributes.length === 0 ? (
            <li className="italic text-zinc-400">- sin atributos -</li>
          ) : (
            data.attributes.map((attribute, index) => (
              <li key={attribute.id ?? `${attribute.name}:${attribute.type}:${index}`}>
                {data.modelType === "ER_LOGICAL"
                  ? erAttributeLine(attribute)
                  : attributeLine(attribute.visibility, attribute.name, attribute.type)}
              </li>
            ))
          )}
        </ul>
      </section>
      {data.modelType === "CLASS" ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-3 pt-1 text-[11px] uppercase tracking-wide text-zinc-500">
            Métodos
          </div>
          <ul className="uml-class-node__list nodrag nowheel min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 font-mono text-xs leading-relaxed text-zinc-700">
            {data.methods.length === 0 ? (
              <li className="italic text-zinc-400">- sin métodos -</li>
            ) : (
              data.methods.map((method, index) => (
                <li key={method.name ? `${method.name}(${method.parameters})::${index}` : `method-${index}`}>
                  {methodLine(
                    method.visibility,
                    method.name,
                    method.parameters,
                    method.returnType,
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}
      </div>
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((position) => (
        <Handle
          key={`source-${position}`}
          type="source"
          position={position}
          id={`source-${position}`}
          className="!size-2.5 !border-2 !border-white !bg-zinc-400"
        />
      ))}
      {cardinalities.map((item) => (
        <CardinalityLabel
          key={item.key}
          cardinality={item.value}
          side={item.side}
          offset={item.offset}
          position={item.position ?? undefined}
        />
      ))}
      {selfBox && anchorHandles.length > 0
        ? anchorHandles.map((handle) => (
            <AnchorHandle
              key={handle.key}
              node={selfBox}
              angle={handle.angle}
              onChange={(angle) =>
                onAnchorPreview(handle.edgeId, handle.end, angle)
              }
              onCommit={(angle) =>
                onAnchorCommit(handle.edgeId, handle.end, angle)
              }
            />
          ))
        : null}
    </div>
  );
}

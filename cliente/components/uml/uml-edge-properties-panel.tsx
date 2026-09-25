"use client";

import { Lock, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MULTIPLICITY_PRESETS,
  multiplicityForPreset,
  presetLabelForMultiplicity,
  type UmlClassFlowEdge,
  type UmlClassFlowEdgeData,
  type UmlClassFlowNode,
} from "@/lib/uml-transformers";
import {
  type UmlEdgePatch,
} from "@/lib/uml-types";
import { RelationTypeIcon, RelationTypeSelect } from "./relation-type-menu";

interface UmlEdgePropertiesPanelProps {
  canEdit: boolean;
  edge: UmlClassFlowEdge | undefined;
  nodes: UmlClassFlowNode[];
  onUpdate: (edgeId: string, patch: UmlEdgePatch) => void;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

export function UmlEdgePropertiesPanel({
  canEdit,
  edge,
  nodes,
  onUpdate,
  onDelete,
  onClose,
}: UmlEdgePropertiesPanelProps) {
  if (!edge) {
    return (
      <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-800">Propiedades</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="h-7 w-7 shrink-0 text-zinc-500 hover:text-zinc-800"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>
        <p className="p-4 text-sm text-zinc-500">
          Selecciona una clase o una relación en el lienzo para editar sus
          propiedades.
        </p>
      </aside>
    );
  }

  const sourceName =
    nodes.find((node) => node.id === edge.source)?.data.name ?? "Origen";
  const targetName =
    nodes.find((node) => node.id === edge.target)?.data.name ?? "Destino";

  const data: UmlClassFlowEdgeData = {
    type: edge.data?.type ?? "ASSOCIATION",
    sourceMin: edge.data?.sourceMin ?? 1,
    sourceMax: edge.data?.sourceMax ?? 1,
    targetMin: edge.data?.targetMin ?? 1,
    targetMax: edge.data?.targetMax ?? 1,
    sourceRole: edge.data?.sourceRole ?? null,
    targetRole: edge.data?.targetRole ?? null,
  };

  const updateType = (type: UmlClassFlowEdgeData["type"]) => {
    onUpdate(edge.id, { type });
  };

  const updateSourceRole = (value: string) => {
    const role = value.trim().length > 0 ? value.trim() : null;
    onUpdate(edge.id, { sourceRole: role });
  };

  const updateTargetRole = (value: string) => {
    const role = value.trim().length > 0 ? value.trim() : null;
    onUpdate(edge.id, { targetRole: role });
  };

  const updateSourceMultiplicity = (value: string) => {
    const { min, max } = multiplicityForPreset(value);
    onUpdate(edge.id, { sourceMin: min, sourceMax: max });
  };

  const updateTargetMultiplicity = (value: string) => {
    const { min, max } = multiplicityForPreset(value);
    onUpdate(edge.id, { targetMin: min, targetMax: max });
  };

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <RelationTypeIcon type={data.type} className="h-5 w-10 text-zinc-800" />
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500">
              <span className="font-medium text-zinc-700">{sourceName}</span>
              {" → "}
              <span className="font-medium text-zinc-700">{targetName}</span>
            </p>
            <h2 className="text-sm font-semibold text-zinc-800">Relación</h2>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="h-7 w-7 shrink-0 text-zinc-500 hover:text-zinc-800"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 [scrollbar-width:thin]">

      {!canEdit ? (
        <p className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Modo solo lectura: no puedes editar la relación.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label>Tipo de relación</Label>
        <RelationTypeSelect value={data.type} onChange={updateType} disabled={!canEdit} />
      </div>

      {data.type === "ASSOCIATION" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="relacion-card-origen">Cardinalidad origen</Label>
            <Select
              value={presetLabelForMultiplicity(data.sourceMin, data.sourceMax)}
              onValueChange={updateSourceMultiplicity}
              disabled={!canEdit}
            >
              <SelectTrigger
                id="relacion-card-origen"
                className="h-9"
                aria-label="Cardinalidad origen"
              >
                <SelectValue placeholder="0..1" />
              </SelectTrigger>
              <SelectContent>
                {MULTIPLICITY_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="relacion-card-destino">Cardinalidad destino</Label>
            <Select
              value={presetLabelForMultiplicity(data.targetMin, data.targetMax)}
              onValueChange={updateTargetMultiplicity}
              disabled={!canEdit}
            >
              <SelectTrigger
                id="relacion-card-destino"
                className="h-9"
                aria-label="Cardinalidad destino"
              >
                <SelectValue placeholder="0..1" />
              </SelectTrigger>
              <SelectContent>
                {MULTIPLICITY_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-500">
          La cardinalidad solo aplica a asociaciones.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="relacion-rol-origen">Rol origen</Label>
          <Input
            id="relacion-rol-origen"
            className="h-9"
            value={data.sourceRole ?? ""}
            disabled={!canEdit}
            placeholder="Ej. Home Team"
            onChange={(event) => updateSourceRole(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="relacion-rol-destino">Rol destino</Label>
          <Input
            id="relacion-rol-destino"
            className="h-9"
            value={data.targetRole ?? ""}
            disabled={!canEdit}
            placeholder="Ej. Away Team"
            onChange={(event) => updateTargetRole(event.target.value)}
          />
        </div>
      </div>

      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDelete(edge.id)}
          disabled={!canEdit}
          className="gap-1.5 self-start text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Eliminar relación
        </Button>
      ) : null}
      </div>
    </aside>
  );
}

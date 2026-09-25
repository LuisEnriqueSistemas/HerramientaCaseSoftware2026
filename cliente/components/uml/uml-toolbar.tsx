"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UmlRelationKind } from "@/lib/uml-types";
import { RelationTypeSelect } from "./relation-type-menu";

interface UmlToolbarProps {
  canEdit: boolean;
  relationKind: UmlRelationKind;
  onRelationKindChange: (kind: UmlRelationKind) => void;
  manyToMany: boolean;
  onManyToManyChange: (value: boolean) => void;
  onAddClass: () => void;
}

export function UmlToolbar({
  canEdit,
  relationKind,
  onRelationKindChange,
  manyToMany,
  onManyToManyChange,
  onAddClass,
}: UmlToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        onClick={onAddClass}
        disabled={!canEdit}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Añadir tabla
      </Button>
      <RelationTypeSelect
        value={relationKind}
        onChange={onRelationKindChange}
        manyToMany={manyToMany}
        onManyToManyChange={onManyToManyChange}
        disabled={!canEdit}
      />
    </div>
  );
}

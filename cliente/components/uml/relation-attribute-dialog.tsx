"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UmlClassFlowNode } from "@/lib/uml-transformers";

interface RelationAttributeDialogProps {
  open: boolean;
  sourceNode: UmlClassFlowNode | undefined;
  targetNode: UmlClassFlowNode | undefined;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sourceAttributeId: string, targetAttributeId: string) => void;
}

export function RelationAttributeDialog({
  open,
  sourceNode,
  targetNode,
  onOpenChange,
  onConfirm,
}: RelationAttributeDialogProps) {
  const [sourceAttributeId, setSourceAttributeId] = useState("");
  const [targetAttributeId, setTargetAttributeId] = useState("");

  const sourceAttributes = sourceNode?.data.attributes ?? [];
  const targetPkAttributes = targetNode?.data.attributes ?? [];

  useEffect(() => {
    if (open) {
      setSourceAttributeId(sourceAttributes[0]?.id ?? "");
      setTargetAttributeId(targetPkAttributes[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canConfirm = sourceAttributeId.length > 0 && targetAttributeId.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Relacionar atributos">
        <DialogHeader>
          <DialogTitle>Relacionar atributos</DialogTitle>
          <DialogDescription>
            {sourceNode && targetNode
              ? `Selecciona un atributo de ${sourceNode.data.name} que referenciará a una PK de ${targetNode.data.name}.`
              : "Selecciona los atributos para la relación."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-attr-source">Atributo origen ({sourceNode?.data.name ?? "Origen"})</Label>
            <Select value={sourceAttributeId} onValueChange={setSourceAttributeId}>
              <SelectTrigger id="rel-attr-source" aria-label="Atributo origen">
                <SelectValue placeholder="Selecciona atributo" />
              </SelectTrigger>
              <SelectContent>
                {sourceAttributes.length === 0 ? (
                  <SelectItem value="" disabled>
                    Sin atributos
                  </SelectItem>
                ) : (
                  sourceAttributes.map((a) => (
                    <SelectItem key={a.id ?? a.name} value={a.id ?? ""}>
                      {a.name} : {a.type}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-attr-target">Atributo destino ({targetNode?.data.name ?? "Destino"})</Label>
            <Select value={targetAttributeId} onValueChange={setTargetAttributeId}>
              <SelectTrigger id="rel-attr-target" aria-label="Atributo destino">
                <SelectValue placeholder="Selecciona atributo" />
              </SelectTrigger>
              <SelectContent>
                {targetPkAttributes.length === 0 ? (
                  <SelectItem value="" disabled>
                    Sin atributos en la tabla destino
                  </SelectItem>
                ) : (
                  targetPkAttributes.map((a) => (
                    <SelectItem key={a.id ?? a.name} value={a.id ?? ""}>
                      {a.name} : {a.type}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(sourceAttributeId, targetAttributeId)}
          >
            Crear relación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

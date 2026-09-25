"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SPRING_BOOT_OPTIONAL_DEPS,
  type SpringBootExtraDep,
} from "@/lib/api";

const EXTRA_LABELS: Record<SpringBootExtraDep, { label: string; hint: string }> = {
  validation: { label: "Validation", hint: "@NotNull en campos no nulos" },
  security: { label: "Security", hint: "Solo dependencia, sin configuración" },
  actuator: { label: "Actuator", hint: "Endpoints de monitoreo" },
  devtools: { label: "DevTools", hint: "Recarga en desarrollo" },
  mapstruct: { label: "MapStruct", hint: "Solo dependencia, sin mappers" },
  flyway: { label: "Flyway", hint: "Migraciones SQL (V1__init.sql)" },
};

interface SpringBootExportDialogProps {
  open: boolean;
  generating: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (extras: SpringBootExtraDep[]) => void;
}

export function SpringBootExportDialog({
  open,
  generating,
  onOpenChange,
  onGenerate,
}: SpringBootExportDialogProps) {
  const [extras, setExtras] = useState<SpringBootExtraDep[]>([]);

  const toggle = (dep: SpringBootExtraDep) => {
    setExtras((current) =>
      current.includes(dep)
        ? current.filter((item) => item !== dep)
        : [...current, dep],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Generar proyecto Spring Boot">
        <DialogHeader>
          <DialogTitle>Generar proyecto Spring Boot</DialogTitle>
          <DialogDescription>
            Base fija: Web, JPA, PostgreSQL, Lombok y Test. Marca extras
            opcionales si los necesitas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {SPRING_BOOT_OPTIONAL_DEPS.map((dep) => (
            <label
              key={dep}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={extras.includes(dep)}
                onChange={() => toggle(dep)}
              />
              <span>
                <span className="font-medium text-zinc-800">
                  {EXTRA_LABELS[dep].label}
                </span>
                <span className="block text-xs text-zinc-500">
                  {EXTRA_LABELS[dep].hint}
                </span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={generating}
            onClick={() => onGenerate(extras)}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Generar ZIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

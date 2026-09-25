"use client";

import type { UmlRelationKind } from "@/lib/uml-types";
import { UML_RELATION_LABELS } from "@/lib/uml-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const RELATION_KINDS: UmlRelationKind[] = [
  "ASSOCIATION",
  "INHERITANCE",
  "REALIZATION",
  "DEPENDENCY",
  "AGGREGATION",
  "COMPOSITION",
];

export function RelationTypeIcon({
  type,
  className = "h-6 w-12",
}: {
  type: UmlRelationKind;
  className?: string;
}) {
  const dashed = type === "REALIZATION" || type === "DEPENDENCY";
  const arrow = type === "ASSOCIATION" || type === "DEPENDENCY";
  const triangle = type === "INHERITANCE" || type === "REALIZATION";
  const diamond = type === "AGGREGATION" || type === "COMPOSITION";

  return (
    <svg viewBox="0 0 64 20" className={className} aria-hidden>
      {diamond ? (
        <path
          d="M 4 10 L 11 4 L 18 10 L 11 16 Z"
          fill={type === "COMPOSITION" ? "currentColor" : "white"}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : null}
      <path
        d={diamond ? "M 18 10 H 55" : "M 5 10 H 55"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={dashed ? "5 3" : undefined}
      />
      {triangle ? (
        <path
          d="M 55 3 L 63 10 L 55 17 Z"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : null}
      {arrow ? (
        <path
          d="M 55 4 L 63 10 L 55 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : null}
    </svg>
  );
}

const MANY_TO_MANY_VALUE = "MANY_TO_MANY";

export function RelationTypeSelect({
  value,
  onChange,
  disabled = false,
  manyToMany = false,
  onManyToManyChange,
}: {
  value: UmlRelationKind;
  onChange: (value: UmlRelationKind) => void;
  disabled?: boolean;
  manyToMany?: boolean;
  onManyToManyChange?: (value: boolean) => void;
}) {
  const selectValue = manyToMany ? MANY_TO_MANY_VALUE : value;
  const selectedLabel = manyToMany
    ? "N:M con tabla intermedia"
    : UML_RELATION_LABELS[value];

  const handleChange = (nextValue: string) => {
    if (nextValue === MANY_TO_MANY_VALUE) {
      onManyToManyChange?.(true);
      return;
    }

    onManyToManyChange?.(false);
    onChange(nextValue as UmlRelationKind);
  };

  return (
    <Select value={selectValue} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={`h-9 w-full gap-2 text-xs sm:w-auto sm:min-w-[190px] ${
          manyToMany ? "border-amber-400 bg-amber-50 text-amber-900" : ""
        }`}
        aria-label="Tipo de relación"
      >
        <SelectValue>
          <span className="flex min-w-0 items-center gap-2">
            {manyToMany ? (
              <span className="flex h-5 w-7 shrink-0 items-center justify-center text-base" aria-hidden>
                ∞
              </span>
            ) : (
              <RelationTypeIcon type={value} className="h-5 w-8 shrink-0 text-zinc-700" />
            )}
            <span className="truncate">{selectedLabel}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {RELATION_KINDS.map((kind) => (
          <SelectItem key={kind} value={kind}>
            <span className="flex items-center gap-2">
              <RelationTypeIcon type={kind} className="h-5 w-9 shrink-0 text-zinc-700" />
              <span>{UML_RELATION_LABELS[kind]}</span>
            </span>
          </SelectItem>
        ))}
        {onManyToManyChange ? (
          <>
            <div className="my-1 border-t border-zinc-100" aria-hidden />
            <SelectItem
              value={MANY_TO_MANY_VALUE}
              className="text-amber-800 focus:bg-amber-50"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-9 shrink-0 items-center justify-center text-base" aria-hidden>
                  ∞
                </span>
                <span>N:M con tabla intermedia</span>
              </span>
            </SelectItem>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}

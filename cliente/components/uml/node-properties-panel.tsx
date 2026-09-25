"use client";

import { useState } from "react";
import { Lock, Minus, Plus, Trash2, X } from "lucide-react";
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
import type {
  UmlClassAttribute,
  UmlClassMethod,
  UmlVisibility,
} from "@/lib/uml-types";
import type { UmlClassFlowNode } from "@/lib/uml-transformers";
import {
  VISIBILITY_LABEL,
  VISIBILITY_SYMBOL,
} from "./uml-class-node";

export interface UmlNodePatch {
  name?: string;
  tableName?: string;
  description?: string | null;
  attributes?: UmlClassAttribute[];
  methods?: UmlClassMethod[];
}

const ER_DATA_TYPES = [
  "INT",
  "SMALLINT",
  "BIGINT",
  "DECIMAL",
  "NUMERIC",
  "FLOAT",
  "DOUBLE",
  "CHAR",
  "VARCHAR",
  "TEXT",
  "DATE",
  "TIME",
  "DATETIME",
  "TIMESTAMP",
  "BOOLEAN",
  "BIT",
  "BLOB",
  "VARBINARY",
  "UUID",
] as const;

interface NodePropertiesPanelProps {
  canEdit: boolean;
  node: UmlClassFlowNode | undefined;
  onPatch: (nodeId: string, patch: UmlNodePatch) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
  modelType: "CLASS" | "ER_LOGICAL";
  availableNodes: UmlClassFlowNode[];
}

const visibilityOptions: UmlVisibility[] = ["public", "private", "protected"];

function VisibilitySelect({
  value,
  disabled,
  onChange,
  label,
}: {
  value: UmlVisibility;
  disabled: boolean;
  onChange: (value: UmlVisibility) => void;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="h-8 w-32"
        aria-label={label}
      >
        <SelectValue placeholder="Visibilidad" />
      </SelectTrigger>
      <SelectContent>
        {visibilityOptions.map((visibility) => (
          <SelectItem key={visibility} value={visibility}>
            {`${VISIBILITY_SYMBOL[visibility]} ${VISIBILITY_LABEL[visibility]}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NodePropertiesPanel({
  canEdit,
  node,
  onPatch,
  onDelete,
  onClose,
  modelType,
  availableNodes,
}: NodePropertiesPanelProps) {
  const [draft, setDraft] = useState<{
    name: string;
    attributes: UmlClassAttribute[];
    methods: UmlClassMethod[];
  } | null>(() =>
    node
      ? {
          name: node.data.name,
          attributes: node.data.attributes.map((attribute) => ({
            ...attribute,
          })),
          methods: node.data.methods.map((method) => ({ ...method })),
        }
      : null,
  );

  if (!node || !draft) {
    return (
      <aside className="flex h-full min-h-0 w-72 shrink-0 flex-col gap-3 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800">Propiedades</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <p className="text-sm text-zinc-500">
          Selecciona una clase en el lienzo para editar sus propiedades.
        </p>
      </aside>
    );
  }

  const updateName = (name: string) => {
    setDraft({ ...draft, name });
    onPatch(node.id, { name });
  };

  const updateAttributes = (attributes: UmlClassAttribute[]) => {
    setDraft({ ...draft, attributes });
    onPatch(node.id, { attributes });
  };

  const updateMethods = (methods: UmlClassMethod[]) => {
    setDraft({ ...draft, methods });
    onPatch(node.id, { methods });
  };

  const addAttribute = () => {
    updateAttributes([
      ...draft.attributes,
      {
        visibility: "private",
        name: "",
        type: "INT",
        keyType: "NONE",
        nullable: true,
        id: crypto.randomUUID(),
      },
    ]);
  };

  const addMethod = () => {
    updateMethods([
      ...draft.methods,
      { visibility: "public", name: "", parameters: "", returnType: "void" },
    ]);
  };

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            {modelType === "ER_LOGICAL" ? "ER · Tabla" : "UML · Clase"}
          </p>
          <h2 className="truncate text-sm font-semibold text-zinc-800">
            Propiedades de tabla
          </h2>
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

      <div className="uml-props-panel__body flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 [scrollbar-width:thin]">
      {!canEdit ? (
        <p className="flex shrink-0 items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Modo solo lectura: no puedes editar propiedades.
        </p>
      ) : null}

      {modelType === "ER_LOGICAL" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tabla-nombre">Nombre de tabla</Label>
            <Input
              id="tabla-nombre"
              value={draft.name}
              disabled={!canEdit}
              onChange={(event) => updateName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entidad-descripcion">Descripción</Label>
            <Input
              id="entidad-descripcion"
              value={node.data.description ?? ""}
              disabled={!canEdit}
              onChange={(event) => onPatch(node.id, { description: event.target.value })}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clase-nombre">Nombre de la clase</Label>
          <Input
            id="clase-nombre"
            value={draft.name}
            disabled={!canEdit}
            onChange={(event) => updateName(event.target.value)}
          />
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label>
            Columnas{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({draft.attributes.length})
            </span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttribute}
            disabled={!canEdit}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Añadir
          </Button>
        </div>
        {draft.attributes.length === 0 ? (
          <p className="text-xs italic text-zinc-400">Sin atributos</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {draft.attributes.map((attribute, index) => (
              <li
                key={index}
                className="flex flex-col gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50/60 p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-1.5">
                  {modelType === "CLASS" ? (
                    <VisibilitySelect
                      value={attribute.visibility}
                      disabled={!canEdit}
                      label={`Visibilidad del atributo ${index + 1}`}
                      onChange={(visibility) =>
                        updateAttributes(
                          draft.attributes.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, visibility } : item,
                          ),
                        )
                      }
                    />
                  ) : null}
                  {modelType === "ER_LOGICAL" ? (
                    <div className="flex flex-wrap gap-1.5">
                      <select
                        value={attribute.keyType ?? "NONE"}
                        disabled={!canEdit}
                        aria-label={`Clave de la columna ${index + 1}`}
                        className="h-8 rounded-md border border-zinc-200 bg-white px-1 text-xs"
                        onChange={(event) =>
                          updateAttributes(
                            draft.attributes.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    keyType: event.target.value as "NONE" | "PK" | "FK",
                                    id: item.id ?? crypto.randomUUID(),
                                    ...(event.target.value !== "FK"
                                      ? {
                                          referencesEntityId: null,
                                          referencesAttributeId: null,
                                        }
                                      : {}),
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="NONE">Sin clave</option>
                        <option value="PK">PK</option>
                        <option value="FK">FK</option>
                      </select>
                      <select
                        value={attribute.type.toUpperCase()}
                        disabled={!canEdit}
                        aria-label={`Tipo de la columna ${index + 1}`}
                        className="h-8 rounded-md border border-zinc-200 bg-white px-1 text-xs"
                        onChange={(event) =>
                          updateAttributes(
                            draft.attributes.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, type: event.target.value }
                                : item,
                            ),
                          )
                        }
                      >
                        {ER_DATA_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <label className="flex h-8 items-center gap-1 text-xs text-zinc-600">
                        <input
                          type="checkbox"
                          checked={attribute.nullable !== false}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateAttributes(
                              draft.attributes.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, nullable: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        NULL
                      </label>
                      <label className="flex h-8 items-center gap-1 text-xs text-zinc-600">
                        <input
                          type="checkbox"
                          checked={attribute.unique === true}
                          disabled={!canEdit || attribute.keyType === "PK"}
                          onChange={(event) =>
                            updateAttributes(
                              draft.attributes.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, unique: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        UNIQUE
                      </label>
                      <label className="flex h-8 items-center gap-1 text-xs text-zinc-600">
                        <input
                          type="checkbox"
                          checked={attribute.isCompositeKey === true}
                          disabled={!canEdit || attribute.keyType !== "PK"}
                          onChange={(event) =>
                            updateAttributes(
                              draft.attributes.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, isCompositeKey: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        PK compuesta
                      </label>
                      {attribute.keyType === "FK" ? (
                        <>
                          <select
                            value={attribute.referencesEntityId ?? ""}
                            disabled={!canEdit}
                            aria-label={`Entidad referenciada de la columna ${index + 1}`}
                            className="h-8 max-w-full rounded-md border border-zinc-200 bg-white px-1 text-xs"
                            onChange={(event) =>
                              updateAttributes(
                                draft.attributes.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        referencesEntityId: event.target.value || null,
                                        referencesAttributeId: null,
                                      }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">Entidad destino</option>
                            {availableNodes
                              .filter((availableNode) => availableNode.id !== node.id)
                              .map((availableNode) => (
                                <option key={availableNode.id} value={availableNode.id}>
                                   {availableNode.data.name}
                                </option>
                              ))}
                          </select>
                          <select
                            value={attribute.referencesAttributeId ?? ""}
                            disabled={!canEdit || !attribute.referencesEntityId}
                            aria-label={`Columna referenciada de la columna ${index + 1}`}
                            className="h-8 max-w-full rounded-md border border-zinc-200 bg-white px-1 text-xs"
                            onChange={(event) =>
                              updateAttributes(
                                draft.attributes.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, referencesAttributeId: event.target.value || null }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">Columna destino</option>
                            {availableNodes
                              .find((availableNode) => availableNode.id === attribute.referencesEntityId)
                              ?.data.attributes.map((item) => (
                                <option key={item.id ?? item.name} value={item.id}>
                                  {item.name} : {item.type}
                                </option>
                              ))}
                          </select>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateAttributes(
                        draft.attributes.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    disabled={!canEdit}
                    aria-label={`Eliminar atributo ${index + 1}`}
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <Input
                    className="h-8"
                    value={attribute.name}
                    disabled={!canEdit}
                    placeholder="nombre"
                    aria-label="Nombre del atributo"
                    onChange={(event) =>
                      updateAttributes(
                        draft.attributes.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  {modelType === "CLASS" ? (
                    <Input
                      className="h-8"
                      value={attribute.type}
                      disabled={!canEdit}
                      placeholder="tipo"
                      aria-label="Tipo del atributo"
                      onChange={(event) =>
                        updateAttributes(
                          draft.attributes.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, type: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modelType === "CLASS" ? <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Métodos</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMethod}
            disabled={!canEdit}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Añadir
          </Button>
        </div>
        {draft.methods.length === 0 ? (
          <p className="text-xs italic text-zinc-400">Sin métodos</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {draft.methods.map((method, index) => (
              <li
                key={index}
                className="flex flex-col gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50/60 p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-1.5">
                  <VisibilitySelect
                    value={method.visibility}
                    disabled={!canEdit}
                    label={`Visibilidad del método ${index + 1}`}
                    onChange={(visibility) =>
                      updateMethods(
                        draft.methods.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, visibility } : item,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateMethods(
                        draft.methods.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    disabled={!canEdit}
                    aria-label={`Eliminar método ${index + 1}`}
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
                <Input
                  className="h-8"
                  value={method.name}
                  disabled={!canEdit}
                  placeholder="nombre"
                  aria-label="Nombre del método"
                  onChange={(event) =>
                    updateMethods(
                      draft.methods.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <div className="flex gap-1.5">
                  <Input
                    className="h-8"
                    value={method.parameters}
                    disabled={!canEdit}
                    placeholder="parámetros"
                    aria-label="Parámetros del método"
                    onChange={(event) =>
                      updateMethods(
                        draft.methods.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, parameters: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <Input
                    className="h-8"
                    value={method.returnType}
                    disabled={!canEdit}
                    placeholder="retorno"
                    aria-label="Tipo de retorno del método"
                    onChange={(event) =>
                      updateMethods(
                        draft.methods.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, returnType: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div> : null}

      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDelete(node.id)}
          className="shrink-0 gap-1.5 self-start text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Eliminar clase
        </Button>
      ) : null}
      </div>
    </aside>
  );
}

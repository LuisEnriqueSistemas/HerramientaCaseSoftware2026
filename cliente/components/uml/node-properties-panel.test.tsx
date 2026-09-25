import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UmlClassFlowNode } from "@/lib/uml-transformers";
import { NodePropertiesPanel } from "./node-properties-panel";

function flowNode(): UmlClassFlowNode {
  return {
    id: "nodo-1",
    type: "umlClass",
    position: { x: 40, y: 60 },
    data: {
      name: "Cliente",
      attributes: [
        {
          visibility: "private",
          name: "id",
          type: "INT",
          nullable: false,
          keyType: "PK",
        },
        { visibility: "private", name: "nombre", type: "VARCHAR" },
      ],
      methods: [],
      modelType: "ER_LOGICAL",
    },
  };
}

describe("NodePropertiesPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("fija el header y delega el scroll al cuerpo del panel", () => {
    const { container } = render(
      <NodePropertiesPanel
        canEdit
        node={flowNode()}
        onPatch={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        modelType="ER_LOGICAL"
        availableNodes={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Propiedades de tabla" }),
    ).toBeDefined();

    const root = container.firstChild as HTMLElement;
    expect(root.tagName).toBe("ASIDE");
    expect(root.className).toContain("overflow-hidden");
    expect(root.className).toContain("min-h-0");

    const body = container.querySelector(".uml-props-panel__body");
    expect(body).not.toBeNull();
    expect(body?.className).toContain("overflow-y-auto");
    expect(body?.className).toContain("min-h-0");

    expect(
      screen.getByRole("button", { name: "Cerrar panel" }),
    ).toBeDefined();
  });

  it("muestra el aviso de solo lectura sin romper la estructura", () => {
    const { container } = render(
      <NodePropertiesPanel
        canEdit={false}
        node={flowNode()}
        onPatch={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        modelType="ER_LOGICAL"
        availableNodes={[]}
      />,
    );

    expect(screen.getByText(/Modo solo lectura/)).toBeDefined();
    expect(
      container.querySelector(".uml-props-panel__body"),
    ).not.toBeNull();
  });

  it("unifica el branch vacío al mismo shell acotado", () => {
    const { container } = render(
      <NodePropertiesPanel
        canEdit
        node={undefined}
        onPatch={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        modelType="ER_LOGICAL"
        availableNodes={[]}
      />,
    );

    const root = container.firstChild as HTMLElement;
    expect(root.tagName).toBe("ASIDE");
    expect(root.className).toContain("h-full");
    expect(root.className).toContain("min-h-0");
    expect(root.className).toContain("overflow-hidden");
    expect(
      screen.getByText("Selecciona una clase en el lienzo para editar sus propiedades."),
    ).toBeDefined();
  });
});

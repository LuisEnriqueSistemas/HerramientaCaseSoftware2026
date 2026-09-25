import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UmlEdgePropertiesPanel } from "./uml-edge-properties-panel";
import type { UmlClassFlowEdge, UmlClassFlowNode } from "@/lib/uml-transformers";

function flowEdge(
  overrides: Partial<UmlClassFlowEdge> = {},
): UmlClassFlowEdge {
  return {
    id: "rel-1",
    source: "nodo-a",
    target: "nodo-b",
    data: {
      type: "ASSOCIATION",
      sourceMin: 1,
      sourceMax: 1,
      targetMin: 0,
      targetMax: null,
      sourceRole: null,
      targetRole: null,
    },
    type: "uml",
    ...overrides,
  } as UmlClassFlowEdge;
}

function flowNode(id: string, name: string): UmlClassFlowNode {
  return {
    id,
    type: "umlClass",
    position: { x: 0, y: 0 },
    width: 220,
    height: 180,
    style: { width: 220, height: 180 },
    data: { name, attributes: [], methods: [] },
  } as UmlClassFlowNode;
}

describe("UmlEdgePropertiesPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra el origen y el destino con scroll interno y header fijo", () => {
    const onUpdate = vi.fn();
    const { container } = render(
      <UmlEdgePropertiesPanel
        canEdit
        edge={flowEdge()}
        nodes={[flowNode("nodo-a", "Cliente"), flowNode("nodo-b", "Pedido")]}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Cliente")).toBeDefined();
    expect(screen.getByText("Pedido")).toBeDefined();

    const root = container.firstChild as HTMLElement;
    expect(root.tagName).toBe("ASIDE");
    expect(root.className).toContain("overflow-hidden");
    expect(root.className).toContain("h-full");

    const body = container.querySelector(".overflow-y-auto");
    expect(body).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Relación" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Cerrar panel" }),
    ).toBeDefined();
  });

  it("permite cambiar la cardinalidad en asociaciones cuando puede editar", () => {
    const onUpdate = vi.fn();
    render(
      <UmlEdgePropertiesPanel
        canEdit
        edge={flowEdge()}
        nodes={[flowNode("nodo-a", "Cliente"), flowNode("nodo-b", "Pedido")]}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Cardinalidad origen" }),
    ).toBeDefined();
    expect(
      screen.getByRole("combobox", { name: "Cardinalidad destino" }),
    ).toBeDefined();

    fireEvent.click(
      screen.getByRole("combobox", { name: "Cardinalidad origen" }),
    );
  });

  it("oculta la cardinalidad para tipos no asociativos", () => {
    const onUpdate = vi.fn();
    render(
      <UmlEdgePropertiesPanel
        canEdit
        edge={flowEdge({
          data: {
            type: "INHERITANCE",
            sourceMin: 1,
            sourceMax: 1,
            targetMin: 1,
            targetMax: 1,
            sourceRole: null,
            targetRole: null,
          },
        })}
        nodes={[flowNode("nodo-a", "Cliente"), flowNode("nodo-b", "Pedido")]}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/cardinalidad solo aplica/)).toBeDefined();
    expect(
      screen.queryByRole("combobox", { name: "Cardinalidad origen" }),
    ).toBeNull();
  });

  it("deshabilita la cardinalidad en modo solo lectura", () => {
    render(
      <UmlEdgePropertiesPanel
        canEdit={false}
        edge={flowEdge()}
        nodes={[flowNode("nodo-a", "Cliente"), flowNode("nodo-b", "Pedido")]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Modo solo lectura/)).toBeDefined();
    expect(
      screen.getByRole("combobox", { name: "Cardinalidad origen" }),
    ).toHaveProperty("disabled", true);
  });

  it("muestra las cuatro cardinalidades soportadas en el select destino", async () => {
    const { container } = render(
      <UmlEdgePropertiesPanel
        canEdit
        edge={flowEdge()}
        nodes={[flowNode("nodo-a", "Cliente"), flowNode("nodo-b", "Pedido")]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    // Sin abrir el menú Radix (portal teletransportado), verifico que el trigger muestre el presente preset
    expect(
      container.querySelector('[aria-label="Cardinalidad destino"]'),
    ).not.toBeNull();
    const allTriggers = container.querySelectorAll('[role="combobox"]');
    // Dos triggers de cardinalidad + uno de tipo de relación
    const cardinalityTriggers = [...allTriggers].filter(
      (el) =>
        el.getAttribute("aria-label")?.startsWith("Cardinalidad") ?? false,
    );
    expect(cardinalityTriggers).toHaveLength(2);
  });
});

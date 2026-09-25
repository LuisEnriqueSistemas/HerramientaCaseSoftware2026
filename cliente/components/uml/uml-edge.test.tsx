import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EdgeProps } from "@xyflow/react";
import type {
  UmlClassFlowEdge,
  UmlClassFlowNode,
} from "@/lib/uml-transformers";
import { NEON_GREEN, UmlEdge } from "./uml-edge";

const flowState = vi.hoisted(() => ({
  nodes: [] as UmlClassFlowNode[],
}));

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    useNodes: () => flowState.nodes,
  };
});

function flowNode(id: string, x: number, y: number): UmlClassFlowNode {
  return {
    id,
    type: "umlClass",
    position: { x, y },
    width: 200,
    height: 100,
    data: { name: id, attributes: [], methods: [] },
  };
}

function edgeProps(
  overrides: Partial<EdgeProps<UmlClassFlowEdge>> = {},
): EdgeProps<UmlClassFlowEdge> {
  return {
    id: "rel-1",
    source: "nodo-a",
    target: "nodo-b",
    sourceHandleId: null,
    targetHandleId: null,
    selected: false,
    data: {
      type: "ASSOCIATION",
      sourceMin: 1,
      sourceMax: 1,
      targetMin: 0,
      targetMax: null,
      sourceRole: null,
      targetRole: null,
      sourceAnchor: null,
      targetAnchor: null,
    },
    ...overrides,
  } as EdgeProps<UmlClassFlowEdge>;
}

describe("UmlEdge", () => {
  afterEach(() => {
    cleanup();
  });

  it("dibuja la ruta step entre los bordes de los nodos", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];

    const { container } = render(<UmlEdge {...edgeProps()} />);

    const path = container.querySelector(".react-flow__edge-path");
    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toContain("M200 50");
  });

  it("usa los puntos de ancla cuando existen", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];

    const { container } = render(
      <UmlEdge
        {...edgeProps({
          data: {
            type: "ASSOCIATION",
            sourceMin: 1,
            sourceMax: 1,
            targetMin: 0,
            targetMax: null,
            sourceRole: null,
            targetRole: null,
            sourceAnchor: { angle: Math.PI / 2 },
            targetAnchor: { angle: -Math.PI / 2 },
          },
        })}
      />,
    );

    const path = container.querySelector(".react-flow__edge-path");
    expect(path?.getAttribute("d")).toContain("M100 100");
  });

  it("resalta en neón cuando está seleccionado", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];

    const { container } = render(<UmlEdge {...edgeProps({ selected: true })} />);

    const group = container.querySelector("g");
    expect(group?.getAttribute("style")).toContain(NEON_GREEN);
    const path = container.querySelector(".react-flow__edge-path");
    expect(path?.getAttribute("style")).toMatch(/39ff14/i);
  });

  it("no renderiza sin los nodos conectados", () => {
    flowState.nodes = [];

    const { container } = render(<UmlEdge {...edgeProps()} />);

    expect(container.querySelector("path")).toBeNull();
  });
});

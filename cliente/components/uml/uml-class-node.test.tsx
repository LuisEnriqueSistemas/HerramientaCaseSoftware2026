import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NodeConnection } from "@xyflow/react";
import type {
  UmlClassFlowEdge,
  UmlClassFlowNode,
} from "@/lib/uml-transformers";
import { UmlClassNodeComponent } from "./uml-class-node";

const flowState = vi.hoisted(() => ({
  connections: [] as NodeConnection[],
  nodes: [] as UmlClassFlowNode[],
  edges: [] as UmlClassFlowEdge[],
}));

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    Handle: ({ id }: { id?: string }) => (
      <div data-testid={id ? `handle-${id}` : "handle"} />
    ),
    useNodeConnections: () => flowState.connections,
    useNodes: () => flowState.nodes,
    useEdges: () => flowState.edges,
  };
});

function flowNode(
  id: string,
  x: number,
  y: number,
  name = id,
): UmlClassFlowNode {
  return {
    id,
    type: "umlClass",
    position: { x, y },
    data: { name, attributes: [], methods: [] },
  };
}

function flowEdge(
  id: string,
  source: string,
  target: string,
  sourceMin = 1,
  sourceMax: number | null = 1,
  targetMin = 0,
  targetMax: number | null = null,
): UmlClassFlowEdge {
  return {
    id,
    source,
    target,
    data: {
      type: "ASSOCIATION",
      sourceMin,
      sourceMax,
      targetMin,
      targetMax,
      sourceRole: null,
      targetRole: null,
    },
  };
}

function connection(
  edgeId: string,
  source: string,
  target: string,
): NodeConnection {
  return { edgeId, source, target, sourceHandle: null, targetHandle: null };
}

function renderNode(id: string) {
  const node = flowState.nodes.find((item) => item.id === id);
  if (!node) {
    throw new Error(`nodo ${id} no encontrado en el mock`);
  }
  return render(
    <UmlClassNodeComponent
      id={node.id}
      type="umlClass"
      data={node.data}
      selected={false}
      dragging={false}
      zIndex={0}
      selectable
      deletable
      draggable
      isConnectable
      positionAbsoluteX={node.position.x}
      positionAbsoluteY={node.position.y}
    />,
  );
}

describe("UmlClassNodeComponent cardinalidad", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza la cardinalidad del extremo origen dentro del nodo", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];
    flowState.edges = [flowEdge("rel-1", "nodo-a", "nodo-b")];
    flowState.connections = [connection("rel-1", "nodo-a", "nodo-b")];

    renderNode("nodo-a");

    const label = screen.getByTestId("cardinality-label");
    expect(label).toHaveTextContent("1");
    expect(label).toHaveAttribute("data-side", "right");
    expect(label.className).toContain("nodrag");
    expect(label.className).toContain("nopan");
  });

  it("renderiza la cardinalidad del extremo destino en el nodo vecino", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];
    flowState.edges = [flowEdge("rel-1", "nodo-a", "nodo-b")];
    flowState.connections = [connection("rel-1", "nodo-a", "nodo-b")];

    renderNode("nodo-b");

    const label = screen.getByTestId("cardinality-label");
    expect(label).toHaveTextContent("0..*");
    expect(label).toHaveAttribute("data-side", "left");
  });

  it("actualiza el lado cuando el nodo se mueve", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];
    flowState.edges = [flowEdge("rel-1", "nodo-a", "nodo-b")];
    flowState.connections = [connection("rel-1", "nodo-a", "nodo-b")];

    const { rerender, unmount } = renderNode("nodo-a");
    expect(screen.getByTestId("cardinality-label")).toHaveAttribute(
      "data-side",
      "right",
    );

    flowState.nodes = [flowNode("nodo-a", 600, 0), flowNode("nodo-b", 300, 0)];
    const moved = flowState.nodes.find((item) => item.id === "nodo-a");
    rerender(
      <UmlClassNodeComponent
        id="nodo-a"
        type="umlClass"
        data={moved!.data}
        selected={false}
        dragging={false}
        zIndex={0}
        selectable
        deletable
        draggable
        isConnectable
        positionAbsoluteX={600}
        positionAbsoluteY={0}
      />,
    );

    expect(screen.getByTestId("cardinality-label")).toHaveAttribute(
      "data-side",
      "left",
    );
    unmount();
  });

  it("apila sin solaparse varios edges del mismo lado", () => {
    flowState.nodes = [
      flowNode("nodo-a", 0, 0),
      flowNode("nodo-b", 300, -20),
      flowNode("nodo-c", 300, 20),
    ];
    flowState.edges = [
      flowEdge("rel-1", "nodo-a", "nodo-b"),
      flowEdge("rel-2", "nodo-a", "nodo-c"),
    ];
    flowState.connections = [
      connection("rel-1", "nodo-a", "nodo-b"),
      connection("rel-2", "nodo-a", "nodo-c"),
    ];

    renderNode("nodo-a");

    const labels = screen.getAllByTestId("cardinality-label");
    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(label).toHaveAttribute("data-side", "right");
    }
    expect(labels[0]!.style.top).not.toBe(labels[1]!.style.top);
  });

  it("no renderiza etiquetas sin conexiones", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0)];
    flowState.edges = [];
    flowState.connections = [];

    renderNode("nodo-a");

    expect(screen.queryByTestId("cardinality-label")).toBeNull();
  });

  it("posiciona la etiqueta en el punto del ancla cuando existe", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];
    const anchored = flowEdge("rel-1", "nodo-a", "nodo-b");
    anchored.data = {
      ...anchored.data!,
      sourceAnchor: { angle: 0 },
      targetAnchor: { angle: Math.PI },
    };
    flowState.edges = [anchored];
    flowState.connections = [connection("rel-1", "nodo-a", "nodo-b")];

    renderNode("nodo-a");

    const label = screen.getByTestId("cardinality-label");
    expect(label).toHaveTextContent("1");
    expect(label.style.transform).toBe("translate(-50%, -50%)");
    expect(label.style.left).not.toContain("calc");
  });

  it("no muestra handles de ancla sin relación seleccionada", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0), flowNode("nodo-b", 300, 0)];
    flowState.edges = [flowEdge("rel-1", "nodo-a", "nodo-b")];
    flowState.connections = [connection("rel-1", "nodo-a", "nodo-b")];

    renderNode("nodo-a");

    expect(screen.queryByTestId("anchor-handle")).toBeNull();
  });

  it("fija el tamaño del nodo y usa scroll interno en las listas", () => {
    flowState.nodes = [flowNode("nodo-a", 0, 0)];
    flowState.edges = [];
    flowState.connections = [];

    const { container } = renderNode("nodo-a");

    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe("220px");
    expect(root.style.height).toBe("180px");
    const lists = container.querySelectorAll(".uml-class-node__list");
    expect(lists.length).toBeGreaterThan(0);
    for (const list of lists) {
      expect(list.className).toContain("overflow-y-auto");
      expect(list.className).toContain("nodrag");
      expect(list.className).toContain("nowheel");
    }
  });
});

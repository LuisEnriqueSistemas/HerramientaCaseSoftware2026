import { describe, expect, it } from "vitest";
import type { UmlClassEdge, UmlClassNode } from "@/lib/uml-types";
import {
  applyEdgePatch,
  edgeStyle,
  ESTILOS_RELACIONES,
  flowEdgeFor,
  formatMultiplicity,
  MULTIPLICITY_PRESETS,
  multiplicityForPreset,
  presetLabelForMultiplicity,
  relationLabel,
  toFlowEdge,
  toFlowEdges,
  toFlowNode,
  toFlowNodes,
  UML_NODE_HEIGHT,
  UML_NODE_WIDTH,
} from "@/lib/uml-transformers";

const classNode: UmlClassNode = {
  id: "nodo-1",
  name: "Usuario",
  x: 40,
  y: 60,
  attributes: [{ visibility: "private", name: "id", type: "uuid" }],
  methods: [{ visibility: "public", name: "crear", parameters: "", returnType: "void" }],
  updatedAt: "2026-09-15T10:00:00.000Z",
};

const classEdge: UmlClassEdge = {
  id: "rel-1",
  sourceId: "nodo-1",
  targetId: "nodo-2",
  type: "INHERITANCE",
  sourceMin: 1,
  sourceMax: 1,
  targetMin: 1,
  targetMax: 1,
  sourceRole: null,
  targetRole: null,
  updatedAt: "2026-09-15T10:00:00.000Z",
};

describe("uml-transformers", () => {
  describe("toFlowNode", () => {
    it("convierte una clase UML a un nodo de React Flow", () => {
      const node = toFlowNode(classNode);

      expect(node).toEqual({
        id: "nodo-1",
        type: "umlClass",
        position: { x: 40, y: 60 },
        width: UML_NODE_WIDTH,
        height: UML_NODE_HEIGHT,
        style: { width: UML_NODE_WIDTH, height: UML_NODE_HEIGHT },
        data: {
          name: "Usuario",
          attributes: expect.arrayContaining([
            expect.objectContaining({ name: "id", type: "uuid" }),
          ]),
          methods: classNode.methods,
        },
      });
      expect(node.data.attributes[0]?.id).toBeDefined();
    });

    it("fija el tamaño del nodo en 220x180", () => {
      const node = toFlowNode(classNode);

      expect(node.width).toBe(220);
      expect(node.height).toBe(180);
      expect(UML_NODE_WIDTH).toBe(220);
      expect(UML_NODE_HEIGHT).toBe(180);
    });
  });

  describe("toFlowNodes", () => {
    it("convierte la lista de clases", () => {
      const nodes = toFlowNodes([classNode]);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe("nodo-1");
      expect(nodes[0].position).toEqual({ x: 40, y: 60 });
    });
  });

  describe("toFlowEdge", () => {
    it("mapea origen, destino y estilo de la herencia", () => {
      const edge = toFlowEdge(classEdge);

      expect(edge).toMatchObject({
        id: "rel-1",
        source: "nodo-1",
        target: "nodo-2",
        label: "",
        markerEnd: "url(#triangle)",
         type: "uml",
         style: { stroke: "#000", strokeWidth: 2 },
      });
    });

    it("propaga multiplicidad y roles en los datos del edge", () => {
      const edge = toFlowEdge({
        ...classEdge,
        type: "ASSOCIATION",
        targetMin: 0,
        targetMax: null,
        targetRole: "órdenes",
      });

      expect(edge.data).toEqual({
        type: "ASSOCIATION",
        sourceMin: 1,
        sourceMax: 1,
        targetMin: 0,
        targetMax: null,
        sourceRole: null,
        targetRole: "órdenes",
        sourceAnchor: null,
        targetAnchor: null,
      });
    });

    it("propaga las anclas persistidas en los datos del edge", () => {
      const edge = toFlowEdge({
        ...classEdge,
        sourceAnchor: { angle: 0.5 },
        targetAnchor: { angle: 2.5 },
      });

      expect(edge.data).toMatchObject({
        sourceAnchor: { angle: 0.5 },
        targetAnchor: { angle: 2.5 },
      });
      expect(edge.type).toBe("uml");
    });
  });

  describe("flowEdgeFor", () => {
    it("aplica default 1..1 en ambos extremos", () => {
      const edge = flowEdgeFor({
        id: "rel-2",
        type: "ASSOCIATION",
        source: "nodo-1",
        target: "nodo-2",
      });

      expect(edge.data).toMatchObject({
        type: "ASSOCIATION",
        sourceMin: 1,
        sourceMax: 1,
        targetMin: 1,
        targetMax: 1,
      });
      expect(edge.label).toBe("");
    });

    it("acepta multiplicidad destino 0..* (unbounded)", () => {
      const edge = flowEdgeFor({
        id: "rel-3",
        type: "COMPOSITION",
        source: "nodo-1",
        target: "nodo-2",
        targetMin: 0,
        targetMax: null,
      });

      expect(edge.data).toMatchObject({ targetMin: 0, targetMax: null });
      expect(edge.label).toBe("");
    });

    it("acepta multiplicidad en ambos extremos", () => {
      const edge = flowEdgeFor({
        id: "rel-6",
        type: "ASSOCIATION",
        source: "nodo-1",
        target: "nodo-2",
        sourceMin: 0,
        sourceMax: 1,
        targetMin: 1,
        targetMax: null,
      });

      expect(edge.label).toBe("");
    });
  });

  describe("applyEdgePatch", () => {
    it("recalcula datos, etiqueta y estilo al cambiar el tipo", () => {
      const edge = flowEdgeFor({
        id: "rel-4",
        type: "ASSOCIATION",
        source: "nodo-1",
        target: "nodo-2",
      });

      const updated = applyEdgePatch(edge, { type: "INHERITANCE" });

      expect(updated.data!.type).toBe("INHERITANCE");
      expect(updated.label).toBe("");
       expect(updated.markerEnd).toBe("url(#triangle)");
       expect(updated.type).toBe("uml");
    });

    it("conserva valores no incluidos en el parche", () => {
      const edge = flowEdgeFor({
        id: "rel-5",
        type: "ASSOCIATION",
        source: "nodo-1",
        target: "nodo-2",
        targetMin: 0,
        targetMax: null,
      });
      const withRole = applyEdgePatch(edge, { targetRole: "órdenes" });

      const updated = applyEdgePatch(withRole, {
        sourceMin: 0,
        sourceMax: 1,
      });

       expect(updated.data).toMatchObject({
        sourceMin: 0,
        sourceMax: 1,
        targetMin: 0,
        targetMax: null,
        targetRole: "órdenes",
      });
    });
  });

  describe("presets de multiplicidad", () => {
    it("resuelve preset 0..* a unbounded", () => {
      expect(multiplicityForPreset("0..*")).toEqual({ min: 0, max: null });
    });

    it("resuelve un valor desconocido a 1..1", () => {
      expect(multiplicityForPreset("2..5")).toEqual({ min: 1, max: 1 });
    });

    it("etiqueta valores personalizados que no están en los presets", () => {
      expect(presetLabelForMultiplicity(2, 5)).toBe("2..5");
      expect(presetLabelForMultiplicity(0, null)).toBe("0..*");
    });

    it("expone los cuatro presets por defecto", () => {
      expect(MULTIPLICITY_PRESETS).toHaveLength(4);
    });
  });

  describe("toFlowEdges", () => {
    it("convierte la lista de relaciones", () => {
      const edges = toFlowEdges([classEdge]);

      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe("nodo-1");
      expect(edges[0].target).toBe("nodo-2");
    });
  });

  describe("relationLabel", () => {
    it("devuelve la etiqueta en español", () => {
      expect(relationLabel("ASSOCIATION")).toBe("Asociación");
      expect(relationLabel("INHERITANCE")).toBe("Herencia");
      expect(relationLabel("AGGREGATION")).toBe("Agregación");
      expect(relationLabel("COMPOSITION")).toBe("Composición");
      expect(relationLabel("DEPENDENCY")).toBe("Dependencia");
    });
  });

  describe("edgeStyle", () => {
    it("usa el triángulo hueco para la herencia", () => {
      expect(edgeStyle("INHERITANCE")).toEqual({
        type: "step",
        markerEnd: "url(#triangle)",
        style: { stroke: "#000", strokeWidth: 2 },
      });
    });

    it("usa el rombo vacío en el origen para la agregación", () => {
      expect(edgeStyle("AGGREGATION")).toEqual({
        type: "step",
        markerStart: "url(#diamond)",
        markerEnd: "url(#arrow)",
        style: { stroke: "#000", strokeWidth: 2 },
      });
    });

    it("usa el rombo relleno en el origen para la composición", () => {
      expect(edgeStyle("COMPOSITION")).toEqual({
        type: "step",
        markerStart: "url(#diamond-filled)",
        markerEnd: "url(#arrow)",
        style: { stroke: "#000", strokeWidth: 2 },
      });
    });

    it("usa línea punteada y flecha abierta para la dependencia", () => {
      expect(edgeStyle("DEPENDENCY")).toEqual({
        type: "step",
        markerEnd: "url(#arrow)",
        style: { stroke: "#000", strokeWidth: 2, strokeDasharray: "5,5" },
      });
    });

    it("usa flecha abierta para la asociación", () => {
      expect(edgeStyle("ASSOCIATION")).toEqual({
        type: "step",
        markerEnd: "url(#arrow)",
        style: { stroke: "#000", strokeWidth: 2 },
      });
    });

    it("usa triángulo vacío y línea punteada para la realización", () => {
      expect(edgeStyle("REALIZATION")).toEqual({
        type: "step",
        markerEnd: "url(#triangle)",
        style: { stroke: "#000", strokeWidth: 2, strokeDasharray: "5,5" },
      });
    });

    it("define los seis estilos UML requeridos", () => {
      expect(Object.keys(ESTILOS_RELACIONES)).toHaveLength(6);
      expect(ESTILOS_RELACIONES.AGGREGATION.markerEnd).toBe("url(#arrow)");
      expect(ESTILOS_RELACIONES.COMPOSITION.markerStart).toBe("url(#diamond-filled)");
    });
  });

  describe("formatMultiplicity", () => {
    it.each([
      [1, 1, "1"],
      [0, 1, "0..1"],
      [1, null, "1..*"],
      [0, null, "0..*"],
      [2, 5, "2..5"],
    ] as const)("formatea %s..%s como %s", (min, max, esperado) => {
      expect(formatMultiplicity(min, max)).toBe(esperado);
    });
  });
});

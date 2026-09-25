import { describe, expect, it } from "vitest";
import {
  ANCHOR_LABEL_OUT_PX,
  angleBucket,
  anchorPointOnRect,
  CARDINALITY_EDGE_OFFSET_PX,
  CARDINALITY_STACK_STEP_PX,
  cardinalityLabelPosition,
  centeredStackOffsets,
  nodeBoxOf,
  resolveCardinalitySide,
} from "@/lib/cardinality-layout";
import { UML_NODE_WIDTH } from "@/lib/uml-transformers";

describe("cardinality-layout", () => {
  describe("resolveCardinalitySide", () => {
    it("elige derecha cuando el vecino está a la derecha", () => {
      expect(resolveCardinalitySide(0, 0, 200, 10)).toBe("right");
    });

    it("elige izquierda cuando el vecino está a la izquierda", () => {
      expect(resolveCardinalitySide(200, 0, 0, 10)).toBe("left");
    });

    it("elige abajo cuando el vecino está debajo", () => {
      expect(resolveCardinalitySide(0, 0, 10, 200)).toBe("bottom");
    });

    it("elige arriba cuando el vecino está encima", () => {
      expect(resolveCardinalitySide(0, 200, 10, 0)).toBe("top");
    });

    it("desempata por el eje dominante en diagonal", () => {
      expect(resolveCardinalitySide(0, 0, 100, 40)).toBe("right");
      expect(resolveCardinalitySide(0, 0, 40, 100)).toBe("bottom");
    });

    it("usa derecha por defecto cuando coinciden las posiciones", () => {
      expect(resolveCardinalitySide(50, 50, 50, 50)).toBe("right");
    });
  });

  describe("centeredStackOffsets", () => {
    it("devuelve vacío sin etiquetas", () => {
      expect(centeredStackOffsets(0)).toEqual([]);
    });

    it("centra una sola etiqueta en cero", () => {
      expect(centeredStackOffsets(1)).toEqual([0]);
    });

    it("reparte dos etiquetas simétricamente sin solaparse", () => {
      const [first, second] = centeredStackOffsets(2);
      expect(second - first).toBe(CARDINALITY_STACK_STEP_PX);
      expect(first).toBe(-second);
    });

    it("mantiene separación mínima entre etiquetas apiladas", () => {
      const offsets = centeredStackOffsets(3);
      for (let index = 1; index < offsets.length; index += 1) {
        expect(offsets[index]! - offsets[index - 1]!).toBe(
          CARDINALITY_STACK_STEP_PX,
        );
      }
    });

    it("expone constantes de diseño positivas", () => {
      expect(CARDINALITY_EDGE_OFFSET_PX).toBeGreaterThan(0);
      expect(CARDINALITY_STACK_STEP_PX).toBeGreaterThan(0);
    });
  });

  describe("nodeBoxOf", () => {
    it("usa las medidas observadas cuando existen", () => {
      expect(
        nodeBoxOf({
          position: { x: 10, y: 20 },
          width: 100,
          measured: { width: 208, height: 90 },
        }),
      ).toEqual({
        position: { x: 10, y: 20 },
        width: 208,
        height: 90,
      });
    });

    it("aplica el ancho por defecto sin medidas", () => {
      expect(nodeBoxOf({ position: { x: 0, y: 0 } })).toEqual({
        position: { x: 0, y: 0 },
        width: UML_NODE_WIDTH,
        height: 180,
      });
    });
  });

  describe("anchorPointOnRect", () => {
    const box = { position: { x: 0, y: 0 }, width: 200, height: 100 };

    it("calcula la intersección en el borde derecho con ángulo 0", () => {
      expect(anchorPointOnRect(box, 0)).toEqual({ x: 200, y: 50 });
    });

    it("calcula la intersección en el borde izquierdo con ángulo PI", () => {
      const point = anchorPointOnRect(box, Math.PI);
      expect(point.x).toBeCloseTo(0, 5);
      expect(point.y).toBeCloseTo(50, 5);
    });

    it("calcula la intersección en el borde inferior con ángulo PI/2", () => {
      const point = anchorPointOnRect(box, Math.PI / 2);
      expect(point.x).toBeCloseTo(100, 5);
      expect(point.y).toBeCloseTo(100, 5);
    });

    it("calcula la intersección en diagonal 45 grados", () => {
      const point = anchorPointOnRect(box, Math.PI / 4);
      expect(point.x).toBeCloseTo(150, 5);
      expect(point.y).toBeCloseTo(100, 5);
    });
  });

  describe("cardinalityLabelPosition", () => {
    const box = { position: { x: 0, y: 0 }, width: 200, height: 100 };

    it("separa la etiqueta del borde hacia afuera", () => {
      const point = cardinalityLabelPosition(box, 0);
      expect(point.x).toBeCloseTo(200 + ANCHOR_LABEL_OUT_PX, 5);
      expect(point.y).toBeCloseTo(50, 5);
    });

    it("apila en el eje perpendicular sin solaparse", () => {
      const first = cardinalityLabelPosition(box, 0, 0);
      const second = cardinalityLabelPosition(box, 0, 1);
      expect(first.x).toBeCloseTo(second.x, 5);
      expect(second.y - first.y).toBeCloseTo(12, 5);
    });
  });

  describe("angleBucket", () => {
    it("agrupa ángulos cercanos en el mismo bucket", () => {
      expect(angleBucket(0.5)).toBe(angleBucket(0.55));
    });

    it("separa ángulos distantes en buckets distintos", () => {
      expect(angleBucket(0)).not.toBe(angleBucket(Math.PI));
    });
  });

  describe("nodeBoxOf altura por defecto", () => {
    it("usa UML_NODE_HEIGHT cuando no hay medida", () => {
      expect(nodeBoxOf({ position: { x: 0, y: 0 } }).height).toBe(180);
    });
  });
});

import type {
  UmlDiagramResponseDto,
  UmlNodeResponseDto,
} from '../dto/uml-diagram-response.dto';
import { UmlXmiExportService } from './uml-xmi-export.service';

const node = (
  id: string,
  name: string,
  attributes: UmlNodeResponseDto['attributes'] = [],
  methods: UmlNodeResponseDto['methods'] = [],
): UmlNodeResponseDto => ({
  id,
  name,
  x: 10,
  y: 20,
  attributes,
  methods,
  updatedAt: '2026-09-15T10:00:00.000Z',
});

const diagram = (
  overrides: Partial<UmlDiagramResponseDto> = {},
): UmlDiagramResponseDto => ({
  diagramId: 'diagram-1',
  projectId: 'project-1',
  version: 1,
  canEdit: true,
  nodes: [],
  edges: [],
  ...overrides,
});

describe('UmlXmiExportService', () => {
  const service = new UmlXmiExportService();

  it('exporta clases, atributos, operaciones y visibilidad', () => {
    const xmi = service.buildXmi(
      diagram({
        nodes: [
          node(
            'class-1',
            'Cliente',
            [{ visibility: 'private', name: 'id', type: 'uuid' }],
            [
              {
                visibility: 'public',
                name: 'buscar',
                parameters: 'id: uuid',
                returnType: 'Cliente',
              },
            ],
          ),
        ],
      }),
    );

    expect(xmi).toContain('xmi:type="uml:Class"');
    expect(xmi).toContain('name="Cliente"');
    expect(xmi).toContain('name="id" visibility="private"');
    expect(xmi).toContain('xmi:type="uml:Operation"');
    expect(xmi).toContain('name="buscar" visibility="public"');
    expect(xmi).toContain('PrimitiveTypes.xmi#String');
  });

  it('exporta relaciones, multiplicidades y agregación', () => {
    const xmi = service.buildXmi(
      diagram({
        nodes: [node('a', 'Hospital'), node('b', 'Sala')],
        edges: [
          {
            id: 'relation-1',
            sourceId: 'a',
            targetId: 'b',
            type: 'COMPOSITION',
            sourceMin: 1,
            sourceMax: 1,
            targetMin: 0,
            targetMax: null,
            sourceRole: null,
            targetRole: 'salas',
            updatedAt: '2026-09-15T10:00:00.000Z',
          },
        ],
      }),
    );

    expect(xmi).toContain('xmi:type="uml:Association"');
    expect(xmi).toContain('aggregation="composite"');
    expect(xmi).toContain('lower="0" upper="*"');
    expect(xmi).toContain('name="salas"');
  });

  it('exporta dependencia como relación UML', () => {
    const xmi = service.buildXmi(
      diagram({
        nodes: [node('a', 'Factura'), node('b', 'Impresora')],
        edges: [
          {
            id: 'relation-1',
            sourceId: 'a',
            targetId: 'b',
            type: 'DEPENDENCY',
            sourceMin: 1,
            sourceMax: 1,
            targetMin: 1,
            targetMax: 1,
            sourceRole: null,
            targetRole: null,
            updatedAt: '2026-09-15T10:00:00.000Z',
          },
        ],
      }),
    );

    expect(xmi).toContain('xmi:type="uml:Dependency"');
    expect(xmi).toContain('client="class_a"');
    expect(xmi).toContain('supplier="class_b"');
  });
});

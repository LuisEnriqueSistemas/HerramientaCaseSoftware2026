import type {
  UmlDiagramResponseDto,
  UmlEdgeResponseDto,
  UmlNodeResponseDto,
} from '../dto/uml-diagram-response.dto';
import {
  ncNameFor,
  UmlXsdExportService,
  xsdTypeFor,
} from './uml-xsd-export.service';

const node = (
  id: string,
  name: string,
  attributes: UmlNodeResponseDto['attributes'] = [],
): UmlNodeResponseDto => ({
  id,
  name,
  x: 0,
  y: 0,
  attributes,
  methods: [],
  updatedAt: '2026-09-15T10:00:00.000Z',
});

const edge = (
  id: string,
  sourceId: string,
  targetId: string,
  type: UmlEdgeResponseDto['type'],
  overrides: Partial<UmlEdgeResponseDto> = {},
): UmlEdgeResponseDto => ({
  id,
  sourceId,
  targetId,
  type,
  sourceMin: 1,
  sourceMax: 1,
  targetMin: 1,
  targetMax: 1,
  sourceRole: null,
  targetRole: null,
  updatedAt: '2026-09-15T10:00:00.000Z',
  ...overrides,
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

describe('UmlXsdExportService', () => {
  const service = new UmlXsdExportService();

  describe('xsdTypeFor', () => {
    it.each([
      ['string', 'xs:string'],
      ['varchar', 'xs:string'],
      ['uuid', 'xs:string'],
      ['int', 'xs:integer'],
      ['integer', 'xs:integer'],
      ['boolean', 'xs:boolean'],
      ['decimal', 'xs:decimal'],
      ['date', 'xs:date'],
      ['datetime', 'xs:dateTime'],
      ['paraNodal', 'xs:string'],
    ] as const)('mapea %s a %s', (type, expected) => {
      expect(xsdTypeFor(type)).toBe(expected);
    });
  });

  describe('ncNameFor', () => {
    it('sanea nombres no válidos como NCName', () => {
      expect(ncNameFor('Mi Clase')).toBe('Mi_Clase');
      expect(ncNameFor('123Clase')).toBe('_123Clase');
      expect(ncNameFor('   ')).toBe('Clase');
    });
  });

  describe('buildXsd', () => {
    it('declara un elemento y un tipo por clase', () => {
      const xsd = service.buildXsd(
        diagram({
          nodes: [
            node('p', 'Person', [
              { visibility: 'public', name: 'surName', type: 'string' },
            ]),
          ],
        }),
      );

      expect(xsd).toContain('<?xml version="1.0"?>');
      expect(xsd).toContain(
        '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">',
      );
      expect(xsd).toContain('<xs:element name="Person" type="Person"/>');
      expect(xsd).toContain('name="Person.surName" type="xs:string"');
      expect(xsd).toContain('</xs:schema>');
    });

    it('representa la herencia con xs:extension base', () => {
      const xsd = service.buildXsd(
        diagram({
          nodes: [node('p', 'Person'), node('e', 'Empleado')],
          edges: [edge('r1', 'e', 'p', 'INHERITANCE')],
        }),
      );

      expect(xsd).toContain('<xs:extension base="Person">');
      expect(xsd).toContain('<xs:complexType name="Empleado">');
      expect(xsd).toContain('<xs:complexContent>');
    });

    it('anida la composición con multiplicidad 0..*', () => {
      const xsd = service.buildXsd(
        diagram({
          nodes: [node('e', 'Empleado'), node('ci', 'ContactInfo')],
          edges: [
            edge('r1', 'e', 'ci', 'COMPOSITION', {
              targetMin: 0,
              targetMax: null,
            }),
          ],
        }),
      );

      expect(xsd).toContain(
        '<xs:element name="ContactInfo" type="ContactInfo" minOccurs="0" maxOccurs="unbounded"/>',
      );
    });

    it('no genera elementos para la dependencia', () => {
      const xsd = service.buildXsd(
        diagram({
          nodes: [node('e', 'Empleado'), node('ci', 'ContactInfo')],
          edges: [edge('r1', 'e', 'ci', 'DEPENDENCY')],
        }),
      );

      expect(xsd).toContain('<xs:complexType name="Empleado"/>');
      expect(xsd).not.toContain('<xs:complexType name="Empleado">');
    });

    it('usa el rol como nombre del elemento para agregación/asociación', () => {
      const xsd = service.buildXsd(
        diagram({
          nodes: [node('p', 'Person'), node('ci', 'ContactInfo')],
          edges: [
            edge('r1', 'p', 'ci', 'AGGREGATION', {
              targetRole: 'contactos',
              targetMin: 1,
              targetMax: 3,
            }),
          ],
        }),
      );

      expect(xsd).toContain(
        '<xs:element name="contactos" type="ContactInfo" minOccurs="1" maxOccurs="3"/>',
      );
    });

    it('desambigua nombres de clase duplicados', () => {
      const xsd = service.buildXsd(
        diagram({
          nodes: [node('a', 'Usuario'), node('b', 'Usuario')],
        }),
      );

      expect(xsd).toContain('<xs:element name="Usuario" type="Usuario"/>');
      expect(xsd).toContain('<xs:element name="Usuario2" type="Usuario2"/>');
    });

    it('aplica los tipos de atributo mapeados dentro del tipo de la clase', () => {
      const xsd = service.buildXsd(
        diagram({
          nodes: [
            node('u', 'Usuario', [
              { visibility: 'private', name: 'edad', type: 'int' },
              { visibility: 'private', name: 'activo', type: 'boolean' },
            ]),
          ],
        }),
      );

      expect(xsd).toContain('name="Usuario.edad" type="xs:integer"');
      expect(xsd).toContain('name="Usuario.activo" type="xs:boolean"');
    });
  });
});

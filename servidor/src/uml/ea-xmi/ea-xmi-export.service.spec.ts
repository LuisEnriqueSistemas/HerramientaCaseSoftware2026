import type { UmlDiagramResponseDto } from '../dto/uml-diagram-response.dto';
import { EaXmiExportService } from './ea-xmi-export.service';

const diagram: UmlDiagramResponseDto = {
  diagramId: 'diagram-1',
  projectId: 'project-1',
  version: 1,
  canEdit: true,
  nodes: [
    {
      id: 'node-1',
      name: 'Hospital',
      x: 120,
      y: 80,
      attributes: [{ visibility: 'private', name: 'id', type: 'uuid' }],
      methods: [],
      updatedAt: '2026-09-15T10:00:00.000Z',
    },
    {
      id: 'node-2',
      name: 'Sala',
      x: 420,
      y: 180,
      attributes: [],
      methods: [],
      updatedAt: '2026-09-15T10:00:00.000Z',
    },
  ],
  edges: [
    {
      id: 'edge-1',
      sourceId: 'node-1',
      targetId: 'node-2',
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
};

describe('EaXmiExportService', () => {
  it('genera XMI 1.1 con clases, posiciones y conectores', () => {
    const result = new EaXmiExportService().buildXmi(diagram);

    expect(result).toContain('<XMI xmi.version="1.1"');
    expect(result).toContain(
      '<UML:Class xmi.id="class_node-1" name="Hospital">',
    );
    expect(result).toContain('<EA:Element');
    expect(result).toContain('subject="class_node-1"');
    expect(result).toContain('x="120" y="80"');
    expect(result).toContain('<EA:Connector');
    expect(result).toContain('source="class_node-1" target="class_node-2"');
    expect(result).toContain('multiplicity="0..*"');
  });

  it('escapa contenido XML', () => {
    const result = new EaXmiExportService().buildXmi({
      ...diagram,
      nodes: [{ ...diagram.nodes[0], name: 'Hospital & Sala' }],
      edges: [],
    });

    expect(result).toContain('Hospital &amp; Sala');
  });
});

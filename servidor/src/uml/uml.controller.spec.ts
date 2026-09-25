import { BadRequestException } from '@nestjs/common';
import { UmlDiagramResponseDto } from './dto/uml-diagram-response.dto';
import { UmlController } from './uml.controller';
import { UmlDiagramService } from './uml-diagram.service';
import { UmlXsdExportService } from './xsd/uml-xsd-export.service';
import { UmlXmiExportService } from './xmi/uml-xmi-export.service';
import { EaXmiExportService } from './ea-xmi/ea-xmi-export.service';

describe('UmlController (CU-10 leer diagrama)', () => {
  let controller: UmlController;
  const service = {
    getDiagram: jest.fn(),
  } as unknown as jest.Mocked<UmlDiagramService>;
  const xsdService = {
    buildXsd: jest.fn(),
  } as unknown as jest.Mocked<UmlXsdExportService>;
  const xmiService = {
    buildXmi: jest.fn(),
  } as unknown as jest.Mocked<UmlXmiExportService>;
  const eaXmiService = {
    buildXmi: jest.fn(),
  } as unknown as jest.Mocked<EaXmiExportService>;

  const request = {
    user: { sub: 'user-1', email: 'a@example.com' },
  } as unknown as Parameters<UmlController['getDiagram']>[0];

  const response = {
    set: jest.fn(),
  } as unknown as Parameters<UmlController['exportDiagram']>[3];

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UmlController(
      service,
      xsdService,
      xmiService,
      eaXmiService,
    );
  });

  it('delega en el servicio con el usuario autenticado y el projectId', async () => {
    const responseDto: UmlDiagramResponseDto = {
      diagramId: 'diagram-1',
      projectId: 'project-1',
      version: 1,
      canEdit: true,
      nodes: [],
      edges: [],
    };
    (service.getDiagram as jest.Mock).mockResolvedValue(responseDto);

    const result = await controller.getDiagram(request, 'project-1');

    expect(service.getDiagram).toHaveBeenCalledWith('user-1', 'project-1');
    expect(result).toBe(responseDto);
  });

  it('propaga canEdit=false cuando el rol es VIEWER', async () => {
    (service.getDiagram as jest.Mock).mockResolvedValue({
      diagramId: 'diagram-1',
      projectId: 'project-1',
      version: 1,
      canEdit: false,
      nodes: [],
      edges: [],
    });

    const result = await controller.getDiagram(request, 'project-1');

    expect(result.canEdit).toBe(false);
  });

  describe('exportDiagram', () => {
    it('descarga el XSD del diagrama con cabeceras', async () => {
      const responseDto: UmlDiagramResponseDto = {
        diagramId: 'diagram-1',
        projectId: 'project-1',
        version: 1,
        canEdit: true,
        nodes: [],
        edges: [],
      };
      (service.getDiagram as jest.Mock).mockResolvedValue(responseDto);
      (xsdService.buildXsd as jest.Mock).mockReturnValue(
        '<?xml version="1.0"?><xs:schema/>',
      );

      const result = await controller.exportDiagram(
        request,
        'project-1',
        undefined,
        response,
      );

      expect(service.getDiagram).toHaveBeenCalledWith('user-1', 'project-1');
      expect(xsdService.buildXsd).toHaveBeenCalledWith(responseDto);
      expect(response.set).toHaveBeenCalledWith({
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="modelo-project-1.xsd"',
      });
      expect(result).toBe('<?xml version="1.0"?><xs:schema/>');
    });

    it('acepta format=xsd', async () => {
      (service.getDiagram as jest.Mock).mockResolvedValue(diagramVacio);
      (xsdService.buildXsd as jest.Mock).mockReturnValue('');

      await expect(
        controller.exportDiagram(request, 'project-1', 'xsd', response),
      ).resolves.toBe('');
    });

    it('descarga XMI compatible con Enterprise Architect', async () => {
      (service.getDiagram as jest.Mock).mockResolvedValue(diagramVacio);
      (xmiService.buildXmi as jest.Mock).mockReturnValue(
        '<?xml version="1.0"?><xmi:XMI/>',
      );

      const result = await controller.exportDiagram(
        request,
        'project-1',
        'xmi',
        response,
      );

      expect(xmiService.buildXmi).toHaveBeenCalledWith(diagramVacio);
      expect(response.set).toHaveBeenCalledWith({
        'Content-Type': 'application/vnd.omg.xmi+xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="modelo-project-1.xmi"',
      });
      expect(result).toContain('<xmi:XMI/>');
    });

    it('descarga EA XMI 1.1 con layout visual', async () => {
      (service.getDiagram as jest.Mock).mockResolvedValue(diagramVacio);
      (eaXmiService.buildXmi as jest.Mock).mockReturnValue(
        '<?xml version="1.0"?><XMI xmi.version="1.1"/>',
      );

      const result = await controller.exportDiagram(
        request,
        'project-1',
        'ea-xmi-1.1',
        response,
      );

      expect(eaXmiService.buildXmi).toHaveBeenCalledWith(diagramVacio);
      expect(response.set).toHaveBeenCalledWith({
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="modelo-project-1-ea.xmi"',
      });
      expect(result).toContain('xmi.version="1.1"');
    });

    it('rechaza formatos no soportados', async () => {
      await expect(
        controller.exportDiagram(request, 'project-1', 'xml', response),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.getDiagram).not.toHaveBeenCalled();
    });
  });
});

const diagramVacio: UmlDiagramResponseDto = {
  diagramId: 'diagram-1',
  projectId: 'project-1',
  version: 1,
  canEdit: true,
  nodes: [],
  edges: [],
};

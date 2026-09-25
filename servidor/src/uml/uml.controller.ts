import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest, type Response } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UmlDiagramResponseDto } from './dto/uml-diagram-response.dto';
import { UmlDiagramService } from './uml-diagram.service';
import { UmlXsdExportService } from './xsd/uml-xsd-export.service';
import { UmlXmiExportService } from './xmi/uml-xmi-export.service';
import { EaXmiExportService } from './ea-xmi/ea-xmi-export.service';

type AuthenticatedRequest = ExpressRequest & { user: JwtPayload };

@Controller('projects')
export class UmlController {
  constructor(
    private readonly umlDiagramService: UmlDiagramService,
    private readonly xsdExportService: UmlXsdExportService,
    private readonly xmiExportService: UmlXmiExportService,
    private readonly eaXmiExportService: EaXmiExportService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':projectId/diagram')
  getDiagram(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ): Promise<UmlDiagramResponseDto> {
    return this.umlDiagramService.getDiagram(request.user.sub, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId/diagram/export')
  async exportDiagram(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    if (
      format !== undefined &&
      format !== 'xsd' &&
      format !== 'xmi' &&
      format !== 'ea-xmi-1.1'
    ) {
      throw new BadRequestException(`Formato no soportado: ${format}`);
    }
    const diagram = await this.umlDiagramService.getDiagram(
      request.user.sub,
      projectId,
    );
    if (format === 'ea-xmi-1.1') {
      const xmi = this.eaXmiExportService.buildXmi(diagram);
      response.set({
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="modelo-${projectId}-ea.xmi"`,
      });
      return xmi;
    }
    if (format === 'xmi') {
      const xmi = this.xmiExportService.buildXmi(diagram);
      response.set({
        'Content-Type': 'application/vnd.omg.xmi+xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="modelo-${projectId}.xmi"`,
      });
      return xmi;
    }
    const xsd = this.xsdExportService.buildXsd(diagram);
    response.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="modelo-${projectId}.xsd"`,
    });
    return xsd;
  }
}

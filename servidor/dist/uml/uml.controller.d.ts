import { Request as ExpressRequest, type Response } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UmlDiagramResponseDto } from './dto/uml-diagram-response.dto';
import { UmlDiagramService } from './uml-diagram.service';
import { UmlXsdExportService } from './xsd/uml-xsd-export.service';
import { UmlXmiExportService } from './xmi/uml-xmi-export.service';
import { EaXmiExportService } from './ea-xmi/ea-xmi-export.service';
type AuthenticatedRequest = ExpressRequest & {
    user: JwtPayload;
};
export declare class UmlController {
    private readonly umlDiagramService;
    private readonly xsdExportService;
    private readonly xmiExportService;
    private readonly eaXmiExportService;
    constructor(umlDiagramService: UmlDiagramService, xsdExportService: UmlXsdExportService, xmiExportService: UmlXmiExportService, eaXmiExportService: EaXmiExportService);
    getDiagram(request: AuthenticatedRequest, projectId: string): Promise<UmlDiagramResponseDto>;
    exportDiagram(request: AuthenticatedRequest, projectId: string, format: string | undefined, response: Response): Promise<string>;
}
export {};

import type { UmlDiagramResponseDto } from '../dto/uml-diagram-response.dto';
export declare class EaXmiExportService {
    buildXmi(diagram: UmlDiagramResponseDto): string;
    private buildClass;
    private buildRelationship;
    private buildVisualElement;
    private buildVisualConnector;
    private upper;
    private escape;
}

import type { UmlDiagramResponseDto } from '../dto/uml-diagram-response.dto';
export declare function xmiNameFor(raw: string, fallback?: string): string;
export declare class UmlXmiExportService {
    buildXmi(diagram: UmlDiagramResponseDto): string;
    private buildClass;
    private buildRelation;
    private primitiveType;
    private upper;
    private escape;
}

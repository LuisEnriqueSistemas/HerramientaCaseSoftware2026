import type { UmlDiagramResponseDto } from '../dto/uml-diagram-response.dto';
export declare function xsdTypeFor(attributeType: string): string;
export declare function ncNameFor(raw: string, fallback?: string): string;
export declare class UmlXsdExportService {
    buildXsd(diagram: UmlDiagramResponseDto): string;
    private buildComplexType;
    private inheritanceTarget;
    private nestedElements;
    private xmlAttributeValue;
}

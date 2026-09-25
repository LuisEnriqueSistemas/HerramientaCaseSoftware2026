import { UmlDiagramService } from '../uml/uml-diagram.service';
import type { UmlEdgeResponseDto, UmlNodeResponseDto } from '../uml/dto/uml-diagram-response.dto';
export declare const SPRING_BOOT_BASELINE_DEPS: readonly ["web", "jpa", "postgresql", "lombok", "test"];
export declare const SPRING_BOOT_OPTIONAL_DEPS: readonly ["validation", "security", "actuator", "devtools", "mapstruct", "flyway"];
export interface SpringBootGenerateOptions {
    deps?: string[];
    groupId?: string;
    artifactId?: string;
    basePackage?: string;
}
export interface GeneratedProjectFile {
    path: string;
    content: string;
}
export interface GeneratorConfig {
    groupId: string;
    artifactId: string;
    basePackage: string;
    dbName: string;
}
export declare class SpringBootGeneratorService {
    private readonly umlDiagramService;
    private readonly logger;
    constructor(umlDiagramService: UmlDiagramService);
    generateZip(userId: string, projectId: string, options?: SpringBootGenerateOptions): Promise<{
        filename: string;
        buffer: Buffer<ArrayBufferLike>;
        warnings: string[];
    }>;
    buildFilesForTest(nodes: UmlNodeResponseDto[], edges: UmlEdgeResponseDto[], options?: SpringBootGenerateOptions): {
        files: GeneratedProjectFile[];
        warnings: string[];
        config: GeneratorConfig;
    };
    private areTypesCompatible;
    private parseDeps;
    private buildConfig;
    private buildModel;
    private buildFiles;
    private renderPom;
    private renderProps;
    private renderApp;
    private renderReadme;
    private renderTable;
    private renderEntity;
    private fieldAnn;
    private renderId;
    private renderRepo;
    private renderService;
    private renderController;
    private renderDto;
    private renderFlyway;
    private zipFiles;
}

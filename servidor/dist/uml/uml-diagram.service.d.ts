import type { ProjectMembersRepository } from '../projects/repositories/project-members-repository.interface';
import { UmlDiagramModelType } from './entities/uml-diagram.entity';
import { UmlDiagramResponseDto, UmlEdgeResponseDto, UmlNodeResponseDto } from './dto/uml-diagram-response.dto';
import type { UmlDiagramRepository } from './repositories/uml-diagram-repository.interface';
import type { GeneratedDiagram } from '../ai/interfaces/ai.types';
export interface UmlNodeChangedResult {
    projectId: string;
    node: UmlNodeResponseDto;
    version: number;
}
export interface UmlNodeDeletedResult {
    projectId: string;
    nodeId: string;
    deletedRelationIds: string[];
    version: number;
}
export interface UmlRelationChangedResult {
    projectId: string;
    edge: UmlEdgeResponseDto;
    version: number;
}
export interface UmlRelationDeletedResult {
    projectId: string;
    edgeId: string;
    version: number;
}
export interface UmlDiagramTypeChangedResult {
    projectId: string;
    modelType: UmlDiagramModelType;
    version: number;
}
export declare class UmlDiagramService {
    private readonly membersRepository;
    private readonly diagramRepository;
    constructor(membersRepository: ProjectMembersRepository, diagramRepository: UmlDiagramRepository);
    getDiagram(userId: string, projectId: string): Promise<UmlDiagramResponseDto>;
    applyDiagramType(userId: string, payload: unknown): Promise<UmlDiagramTypeChangedResult>;
    applyGeneratedDiagram(userId: string, projectId: string, structure: GeneratedDiagram): Promise<UmlDiagramResponseDto>;
    applyNodeAdded(userId: string, payload: unknown): Promise<UmlNodeChangedResult>;
    applyNodeUpdated(userId: string, payload: unknown): Promise<UmlNodeChangedResult>;
    applyNodeDeleted(userId: string, payload: unknown): Promise<UmlNodeDeletedResult>;
    applyRelationAdded(userId: string, payload: unknown): Promise<UmlRelationChangedResult>;
    applyRelationUpdated(userId: string, payload: unknown): Promise<UmlRelationChangedResult>;
    applyRelationDeleted(userId: string, payload: unknown): Promise<UmlRelationDeletedResult>;
    private getMembershipOrThrow;
    private requireEditor;
    private findNodeInDiagram;
    private bumpVersion;
    private parsePayload;
    private assertProjectId;
    private assertUuid;
    private assertName;
    private assertNumber;
    private assertAttribute;
    private validateErAttributes;
    private assertMethod;
    private parseNodeInput;
    private parseNodePatch;
    private parseAttributes;
    private parseMethods;
    private parseEdgeInput;
    private assertRelationType;
    private parseRelationPatch;
    private parseEndMultiplicity;
    private assertNonNegativeInt;
    private parseRole;
    private toNodeResponse;
    private areTypesCompatible;
    private normalizeGeneratedAttributeTypes;
    private toEdgeResponse;
}

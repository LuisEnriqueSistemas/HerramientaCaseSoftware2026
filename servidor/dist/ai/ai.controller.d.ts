import type { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AiAssistantService } from './ai-assistant.service';
import { DeepseekService } from './deepseek.service';
type AuthenticatedRequest = ExpressRequest & {
    user: JwtPayload;
};
export declare class AiController {
    private readonly aiAssistantService;
    private readonly deepseekService;
    constructor(aiAssistantService: AiAssistantService, deepseekService: DeepseekService);
    generateFromPrompt(request: AuthenticatedRequest, projectId: string, body: {
        prompt?: string;
    }): Promise<import("../uml/dto/uml-diagram-response.dto").UmlDiagramResponseDto>;
    generateFromAudio(request: AuthenticatedRequest, projectId: string, file: Parameters<AiAssistantService['generateFromAudio']>[2]): Promise<import("../uml/dto/uml-diagram-response.dto").UmlDiagramResponseDto>;
}
export declare class AiStatusController {
    private readonly deepseekService;
    constructor(deepseekService: DeepseekService);
    getStatus(): Promise<{
        available: boolean;
        provider: "deepseek";
        model: string;
        message: string;
    }>;
}
export {};

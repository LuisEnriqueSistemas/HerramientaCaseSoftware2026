import { ConfigService } from '@nestjs/config';
import type { GeneratedDiagram } from './interfaces/ai.types';
export declare class DeepseekService {
    private readonly configService;
    constructor(configService: ConfigService);
    private readonly baseUrl;
    private readonly apiKey;
    private readonly model;
    getStatus(): Promise<{
        available: boolean;
        provider: 'deepseek';
        model: string;
        message: string;
    }>;
    generateDiagram(prompt: string, context: unknown): Promise<GeneratedDiagram>;
    private normalizeDiagram;
    private normalizeClass;
    private normalizeRelation;
    private normalizeAttributeType;
    private normalizeRelationType;
}

import type { UmlDiagramResponseDto } from '../uml/dto/uml-diagram-response.dto';
import { UmlDiagramService } from '../uml/uml-diagram.service';
import type { GeneratedDiagram } from './interfaces/ai.types';
import { AudioTranscriptionService } from './audio-transcription.service';
import { DeepseekService } from './deepseek.service';
import { UmlGateway } from '../uml/uml.gateway';
export declare class AiAssistantService {
    private readonly deepseekService;
    private readonly audioTranscriptionService;
    private readonly umlDiagramService;
    private readonly umlGateway;
    constructor(deepseekService: DeepseekService, audioTranscriptionService: AudioTranscriptionService, umlDiagramService: UmlDiagramService, umlGateway: UmlGateway);
    generateFromPrompt(userId: string, projectId: string, prompt: string): Promise<UmlDiagramResponseDto>;
    generateFromAudio(userId: string, projectId: string, file: Parameters<AudioTranscriptionService['transcribe']>[0]): Promise<UmlDiagramResponseDto>;
    validateStructure(value: unknown): GeneratedDiagram;
}

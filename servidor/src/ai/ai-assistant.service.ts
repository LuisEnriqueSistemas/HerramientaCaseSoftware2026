import { BadRequestException, Injectable } from '@nestjs/common';
import type { UmlDiagramResponseDto } from '../uml/dto/uml-diagram-response.dto';
import { UmlDiagramService } from '../uml/uml-diagram.service';
import type { GeneratedDiagram } from './interfaces/ai.types';
import { AudioTranscriptionService } from './audio-transcription.service';
import { DeepseekService } from './deepseek.service';
import { UmlGateway } from '../uml/uml.gateway';

@Injectable()
export class AiAssistantService {
  constructor(
    private readonly deepseekService: DeepseekService,
    private readonly audioTranscriptionService: AudioTranscriptionService,
    private readonly umlDiagramService: UmlDiagramService,
    private readonly umlGateway: UmlGateway,
  ) {}

  async generateFromPrompt(
    userId: string,
    projectId: string,
    prompt: string,
  ): Promise<UmlDiagramResponseDto> {
    if (typeof prompt !== 'string' || prompt.trim().length < 10) {
      throw new BadRequestException('Describe el sistema con más detalle');
    }
    const current = await this.umlDiagramService.getDiagram(userId, projectId);
    const generated = this.validateStructure(
      await this.deepseekService.generateDiagram(prompt.trim(), current),
    );
    const diagram = await this.umlDiagramService.applyGeneratedDiagram(
      userId,
      projectId,
      generated,
    );
    this.umlGateway.emitDiagramGenerated(projectId, diagram);
    return diagram;
  }

  async generateFromAudio(
    userId: string,
    projectId: string,
    file: Parameters<AudioTranscriptionService['transcribe']>[0],
  ): Promise<UmlDiagramResponseDto> {
    const prompt = await this.audioTranscriptionService.transcribe(file);
    return this.generateFromPrompt(userId, projectId, prompt);
  }

  validateStructure(value: unknown): GeneratedDiagram {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('La estructura generada no es válida');
    }
    const structure = value as Partial<GeneratedDiagram>;
    if (
      !Array.isArray(structure.classes) ||
      !Array.isArray(structure.relations)
    ) {
      throw new BadRequestException('La IA debe devolver clases y relaciones');
    }
    return structure as GeneratedDiagram;
  }
}

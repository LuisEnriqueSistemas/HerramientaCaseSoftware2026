import { BadRequestException } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import type { AudioTranscriptionService } from './audio-transcription.service';
import type { DeepseekService } from './deepseek.service';
import type { UmlDiagramService } from '../uml/uml-diagram.service';
import type { UmlGateway } from '../uml/uml.gateway';

describe('AiAssistantService', () => {
  const deepseekService = {
    generateDiagram: jest.fn(),
  } as unknown as jest.Mocked<DeepseekService>;
  const audioService = {
    transcribe: jest.fn(),
  } as unknown as jest.Mocked<AudioTranscriptionService>;
  const umlService = {
    getDiagram: jest.fn(),
    applyGeneratedDiagram: jest.fn(),
  } as unknown as jest.Mocked<UmlDiagramService>;
  const gateway = {
    emitDiagramGenerated: jest.fn(),
  } as unknown as jest.Mocked<UmlGateway>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('genera, valida, aplica y publica un diagrama desde prompt', async () => {
    const diagram = {
      projectId: 'project-1',
      nodes: [],
      edges: [],
    };
    const generated = {
      classes: [{ name: 'Cliente' }],
      relations: [],
    };
    umlService.getDiagram.mockResolvedValue(diagram as never);
    deepseekService.generateDiagram.mockResolvedValue(generated);
    umlService.applyGeneratedDiagram.mockResolvedValue(diagram as never);
    const service = new AiAssistantService(
      deepseekService,
      audioService,
      umlService,
      gateway,
    );

    const result = await service.generateFromPrompt(
      'user-1',
      'project-1',
      'Crea una clase Cliente con nombre',
    );

    expect(deepseekService.generateDiagram).toHaveBeenCalledWith(
      'Crea una clase Cliente con nombre',
      diagram,
    );
    expect(umlService.applyGeneratedDiagram).toHaveBeenCalledWith(
      'user-1',
      'project-1',
      generated,
    );
    expect(gateway.emitDiagramGenerated).toHaveBeenCalledWith(
      'project-1',
      diagram,
    );
    expect(result).toBe(diagram);
  });

  it('rechaza prompts demasiado cortos', async () => {
    const service = new AiAssistantService(
      deepseekService,
      audioService,
      umlService,
      gateway,
    );

    await expect(
      service.generateFromPrompt('user-1', 'project-1', 'hola'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(deepseekService.generateDiagram).not.toHaveBeenCalled();
  });

  it('usa la transcripción local para generar desde audio', async () => {
    const diagram = { projectId: 'project-1' };
    audioService.transcribe.mockResolvedValue('Crea Cliente y Pedido');
    umlService.getDiagram.mockResolvedValue(diagram as never);
    deepseekService.generateDiagram.mockResolvedValue({
      classes: [{ name: 'Cliente' }],
      relations: [],
    });
    umlService.applyGeneratedDiagram.mockResolvedValue(diagram as never);
    const service = new AiAssistantService(
      deepseekService,
      audioService,
      umlService,
      gateway,
    );

    await service.generateFromAudio('user-1', 'project-1', undefined);

    expect(audioService.transcribe).toHaveBeenCalledWith(undefined);
    expect(deepseekService.generateDiagram).toHaveBeenCalled();
  });
});

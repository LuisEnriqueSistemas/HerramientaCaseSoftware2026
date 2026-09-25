import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { UmlModule } from '../uml/uml.module';
import { AiController, AiStatusController } from './ai.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AudioTranscriptionService } from './audio-transcription.service';
import { DeepseekService } from './deepseek.service';

@Module({
  imports: [ProjectsModule, UmlModule],
  controllers: [AiController, AiStatusController],
  providers: [AiAssistantService, AudioTranscriptionService, DeepseekService],
})
export class AiModule {}

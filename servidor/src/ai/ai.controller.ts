import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiAssistantService } from './ai-assistant.service';
import { DeepseekService } from './deepseek.service';

type AuthenticatedRequest = ExpressRequest & { user: JwtPayload };

@Controller('projects/:projectId/ai')
export class AiController {
  constructor(
    private readonly aiAssistantService: AiAssistantService,
    private readonly deepseekService: DeepseekService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('prompt')
  generateFromPrompt(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Body() body: { prompt?: string },
  ) {
    return this.aiAssistantService.generateFromPrompt(
      request.user.sub,
      projectId,
      body.prompt ?? '',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('audio')
  @UseInterceptors(FileInterceptor('file'))
  generateFromAudio(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @UploadedFile()
    file: Parameters<AiAssistantService['generateFromAudio']>[2],
  ) {
    return this.aiAssistantService.generateFromAudio(
      request.user.sub,
      projectId,
      file,
    );
  }
}

@Controller('ai')
export class AiStatusController {
  constructor(private readonly deepseekService: DeepseekService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  getStatus() {
    return this.deepseekService.getStatus();
  }
}

import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Req,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpringBootGeneratorService } from './spring-boot-generator.service';

type AuthenticatedRequest = ExpressRequest & { user: JwtPayload };

@Controller('projects/:projectId/generate')
export class SpringBootGeneratorController {
  constructor(private readonly generatorService: SpringBootGeneratorService) {}

  @UseGuards(JwtAuthGuard)
  @Get('spring-boot')
  @Header('Content-Type', 'application/octet-stream')
  async generateSpringBoot(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Query('deps') deps?: string,
    @Query('package') basePackage?: string,
    @Query('artifact') artifactId?: string,
    @Query('group') groupId?: string,
  ): Promise<StreamableFile> {
    const result = await this.generatorService.generateZip(
      request.user.sub,
      projectId,
      {
        deps: deps
          ? deps
              .split(',')
              .map((d) => d.trim())
              .filter(Boolean)
          : [],
        basePackage,
        artifactId,
        groupId,
      },
    );
    return new StreamableFile(result.buffer, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}

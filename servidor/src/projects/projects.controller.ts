import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ProjectDetailDto,
  ProjectListItemDto,
  ProjectResponseDto,
} from './dto/project-response.dto';
import { ProjectsService } from './projects.service';

type AuthenticatedRequest = ExpressRequest & { user: JwtPayload };

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.createProject(
      request.user.sub,
      dto.name,
      dto.description ?? null,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() request: AuthenticatedRequest): Promise<ProjectListItemDto[]> {
    return this.projectsService.listProjectsForUser(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId')
  getDetail(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ): Promise<ProjectDetailDto> {
    return this.projectsService.getProjectDetail(request.user.sub, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':projectId')
  @HttpCode(200)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ): Promise<{ ok: true }> {
    await this.projectsService.deleteProject(request.user.sub, projectId);
    return { ok: true };
  }
}

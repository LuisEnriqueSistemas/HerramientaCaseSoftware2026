import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDetailDto, ProjectListItemDto, ProjectResponseDto } from './dto/project-response.dto';
import { ProjectsService } from './projects.service';
type AuthenticatedRequest = ExpressRequest & {
    user: JwtPayload;
};
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(request: AuthenticatedRequest, dto: CreateProjectDto): Promise<ProjectResponseDto>;
    list(request: AuthenticatedRequest): Promise<ProjectListItemDto[]>;
    getDetail(request: AuthenticatedRequest, projectId: string): Promise<ProjectDetailDto>;
    remove(request: AuthenticatedRequest, projectId: string): Promise<{
        ok: true;
    }>;
}
export {};

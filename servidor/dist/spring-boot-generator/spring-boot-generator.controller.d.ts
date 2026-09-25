import { StreamableFile } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SpringBootGeneratorService } from './spring-boot-generator.service';
type AuthenticatedRequest = ExpressRequest & {
    user: JwtPayload;
};
export declare class SpringBootGeneratorController {
    private readonly generatorService;
    constructor(generatorService: SpringBootGeneratorService);
    generateSpringBoot(request: AuthenticatedRequest, projectId: string, deps?: string, basePackage?: string, artifactId?: string, groupId?: string): Promise<StreamableFile>;
}
export {};

import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { ProjectMemberRole } from './entities/project-member.entity';
import { ProjectMembersService } from './project-members.service';
type AuthenticatedRequest = ExpressRequest & {
    user: JwtPayload;
};
interface InvitationCreatedDto {
    id: string;
    projectId: string;
    email: string;
    role: ProjectMemberRole;
    createdAt: Date;
}
export declare class ProjectMembersController {
    private readonly projectMembersService;
    constructor(projectMembersService: ProjectMembersService);
    invite(request: AuthenticatedRequest, projectId: string, dto: InviteUserDto): Promise<InvitationCreatedDto>;
    listMembers(request: AuthenticatedRequest, projectId: string): Promise<MemberResponseDto[]>;
    updateMemberRole(request: AuthenticatedRequest, projectId: string, userId: string, dto: UpdateMemberRoleDto): Promise<{
        ok: true;
    }>;
    removeMember(request: AuthenticatedRequest, projectId: string, userId: string): Promise<{
        ok: true;
    }>;
}
export {};

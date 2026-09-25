import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { ProjectMemberRole } from './entities/project-member.entity';
import { ProjectMembersService } from './project-members.service';

type AuthenticatedRequest = ExpressRequest & { user: JwtPayload };

interface InvitationCreatedDto {
  id: string;
  projectId: string;
  email: string;
  role: ProjectMemberRole;
  createdAt: Date;
}

@Controller('projects/:projectId')
export class ProjectMembersController {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('invitations')
  invite(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Body() dto: InviteUserDto,
  ): Promise<InvitationCreatedDto> {
    return this.projectMembersService.inviteUser(
      request.user.sub,
      projectId,
      dto.email,
      dto.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('members')
  listMembers(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ): Promise<MemberResponseDto[]> {
    return this.projectMembersService.listMembers(request.user.sub, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('members/:userId')
  @HttpCode(200)
  async updateMemberRole(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<{ ok: true }> {
    await this.projectMembersService.updateMemberRole(
      request.user.sub,
      projectId,
      userId,
      dto.role,
    );
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('members/:userId')
  @HttpCode(200)
  async removeMember(
    @Req() request: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ): Promise<{ ok: true }> {
    await this.projectMembersService.removeMember(
      request.user.sub,
      projectId,
      userId,
    );
    return { ok: true };
  }
}

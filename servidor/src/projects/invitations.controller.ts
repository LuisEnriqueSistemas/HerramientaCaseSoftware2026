import {
  Controller,
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
import { InvitationsService } from './invitations.service';

type AuthenticatedRequest = ExpressRequest & { user: JwtPayload };

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  listPending(@Req() request: AuthenticatedRequest) {
    return this.invitationsService.listPending(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':invitationId/accept')
  @HttpCode(200)
  async accept(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<{ ok: true }> {
    await this.invitationsService.accept(request.user.sub, invitationId);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':invitationId/reject')
  @HttpCode(200)
  async reject(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<{ ok: true }> {
    await this.invitationsService.reject(request.user.sub, invitationId);
    return { ok: true };
  }
}

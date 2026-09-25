import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { InvitationsService } from './invitations.service';
type AuthenticatedRequest = ExpressRequest & {
    user: JwtPayload;
};
export declare class InvitationsController {
    private readonly invitationsService;
    constructor(invitationsService: InvitationsService);
    listPending(request: AuthenticatedRequest): Promise<{
        id: string;
        projectId: string;
        projectName: string;
        email: string;
        role: import("./entities/project-member.entity").ProjectMemberRole;
        status: import("./entities/project-invitation.entity").ProjectInvitationStatus;
        createdAt: Date;
    }[]>;
    accept(request: AuthenticatedRequest, invitationId: string): Promise<{
        ok: true;
    }>;
    reject(request: AuthenticatedRequest, invitationId: string): Promise<{
        ok: true;
    }>;
}
export {};

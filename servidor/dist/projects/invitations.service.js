"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const users_repository_interface_1 = require("../users/repositories/users-repository.interface");
const project_invitation_entity_1 = require("./entities/project-invitation.entity");
const project_invitations_repository_interface_1 = require("./repositories/project-invitations-repository.interface");
const project_members_repository_interface_1 = require("./repositories/project-members-repository.interface");
const projects_repository_interface_1 = require("./repositories/projects-repository.interface");
let InvitationsService = class InvitationsService {
    invitationsRepository;
    membersRepository;
    projectsRepository;
    usersRepository;
    constructor(invitationsRepository, membersRepository, projectsRepository, usersRepository) {
        this.invitationsRepository = invitationsRepository;
        this.membersRepository = membersRepository;
        this.projectsRepository = projectsRepository;
        this.usersRepository = usersRepository;
    }
    async requireUser(userId) {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return user;
    }
    async listPending(userId) {
        const user = await this.requireUser(userId);
        const invitations = await this.invitationsRepository.findPendingByEmail(user.email);
        const projects = await this.projectsRepository.findByIds(invitations.map((invitation) => invitation.projectId));
        const projectNames = new Map(projects.map((project) => [project.id, project.name]));
        return invitations
            .filter((invitation) => projectNames.has(invitation.projectId))
            .map((invitation) => ({
            id: invitation.id,
            projectId: invitation.projectId,
            projectName: projectNames.get(invitation.projectId),
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            createdAt: invitation.createdAt,
        }));
    }
    async getPendingInvitation(userId, invitationId) {
        const user = await this.requireUser(userId);
        const invitation = await this.invitationsRepository.findById(invitationId);
        if (!invitation) {
            throw new common_1.NotFoundException('La invitación no existe');
        }
        if (invitation.email !== user.email) {
            throw new common_1.ForbiddenException('Esta invitación no te corresponde a ti');
        }
        if (invitation.status !== project_invitation_entity_1.ProjectInvitationStatus.PENDING) {
            throw new common_1.ConflictException('La invitación ya fue procesada anteriormente');
        }
        return { user, invitation };
    }
    async accept(userId, invitationId) {
        const { user, invitation } = await this.getPendingInvitation(userId, invitationId);
        const existingMember = await this.membersRepository.find(invitation.projectId, user.id);
        if (existingMember) {
            throw new common_1.ConflictException('Ya eres miembro de este proyecto');
        }
        await this.invitationsRepository.updateStatus(invitation.id, project_invitation_entity_1.ProjectInvitationStatus.ACCEPTED);
        await this.membersRepository.add(invitation.projectId, user.id, invitation.role);
    }
    async reject(userId, invitationId) {
        const { invitation } = await this.getPendingInvitation(userId, invitationId);
        await this.invitationsRepository.updateStatus(invitation.id, project_invitation_entity_1.ProjectInvitationStatus.REJECTED);
    }
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(project_invitations_repository_interface_1.PROJECT_INVITATIONS_REPOSITORY)),
    __param(1, (0, common_1.Inject)(project_members_repository_interface_1.PROJECT_MEMBERS_REPOSITORY)),
    __param(2, (0, common_1.Inject)(projects_repository_interface_1.PROJECTS_REPOSITORY)),
    __param(3, (0, common_1.Inject)(users_repository_interface_1.USERS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map
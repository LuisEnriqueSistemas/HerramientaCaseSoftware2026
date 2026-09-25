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
exports.ProjectMembersService = void 0;
const common_1 = require("@nestjs/common");
const users_repository_interface_1 = require("../users/repositories/users-repository.interface");
const project_member_entity_1 = require("./entities/project-member.entity");
const project_members_repository_interface_1 = require("./repositories/project-members-repository.interface");
const project_invitations_repository_interface_1 = require("./repositories/project-invitations-repository.interface");
const projects_repository_interface_1 = require("./repositories/projects-repository.interface");
const invite_user_dto_1 = require("./dto/invite-user.dto");
const projects_gateway_1 = require("./projects.gateway");
const toMemberRole = (role) => role === invite_user_dto_1.InviteRole.EDITOR
    ? project_member_entity_1.ProjectMemberRole.EDITOR
    : project_member_entity_1.ProjectMemberRole.VIEWER;
let ProjectMembersService = class ProjectMembersService {
    membersRepository;
    invitationsRepository;
    usersRepository;
    projectsRepository;
    projectsGateway;
    constructor(membersRepository, invitationsRepository, usersRepository, projectsRepository, projectsGateway) {
        this.membersRepository = membersRepository;
        this.invitationsRepository = invitationsRepository;
        this.usersRepository = usersRepository;
        this.projectsRepository = projectsRepository;
        this.projectsGateway = projectsGateway;
    }
    assertCanManage(membership, action) {
        if (!membership) {
            throw new common_1.NotFoundException('No eres miembro de este proyecto');
        }
        if (membership.role !== project_member_entity_1.ProjectMemberRole.HOST) {
            throw new common_1.ForbiddenException(`No tienes permiso para ${action}`);
        }
    }
    async findMemberOrThrow(projectId, userId) {
        const membership = await this.membersRepository.find(projectId, userId);
        this.assertCanManage(membership, 'gestionar miembros');
        return membership;
    }
    async inviteUser(actorId, projectId, email, role) {
        await this.findMemberOrThrow(projectId, actorId);
        const target = await this.usersRepository.findByEmail(email);
        if (!target) {
            throw new common_1.BadRequestException('El correo no está registrado');
        }
        if (target.id === actorId) {
            throw new common_1.ConflictException('No puedes invitarte a ti mismo');
        }
        const existingMember = await this.membersRepository.find(projectId, target.id);
        if (existingMember) {
            throw new common_1.ConflictException('El usuario ya es miembro de este proyecto');
        }
        const existingInvitation = await this.invitationsRepository.findPendingByProjectAndEmail(projectId, email);
        if (existingInvitation) {
            throw new common_1.ConflictException('Ya existe una invitación pendiente para este correo');
        }
        const invitation = await this.invitationsRepository.createAndSave({
            projectId,
            invitedByUserId: actorId,
            email,
            role: toMemberRole(role),
        });
        return {
            id: invitation.id,
            projectId: invitation.projectId,
            email: invitation.email,
            role: invitation.role,
            createdAt: invitation.createdAt,
        };
    }
    async listMembers(actorId, projectId) {
        const membership = await this.membersRepository.find(projectId, actorId);
        if (!membership) {
            throw new common_1.NotFoundException('No eres miembro de este proyecto');
        }
        if (membership.role !== project_member_entity_1.ProjectMemberRole.HOST &&
            membership.role !== project_member_entity_1.ProjectMemberRole.EDITOR) {
            throw new common_1.ForbiddenException('No tienes permiso para ver los miembros de este proyecto');
        }
        const members = await this.membersRepository.listByProject(projectId);
        const users = await this.usersRepository.findManyByIds(members.map((member) => member.userId));
        const byId = new Map(users.map((user) => [user.id, user]));
        const result = [];
        for (const member of members) {
            const user = byId.get(member.userId);
            if (user) {
                result.push({
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    role: member.role,
                });
            }
        }
        return result;
    }
    async updateMemberRole(actorId, projectId, targetUserId, role) {
        await this.findMemberOrThrow(projectId, actorId);
        if (targetUserId === actorId) {
            throw new common_1.BadRequestException('No puedes cambiar tu propio rol');
        }
        const targetMembership = await this.membersRepository.find(projectId, targetUserId);
        if (!targetMembership) {
            throw new common_1.NotFoundException('El usuario no es miembro del proyecto');
        }
        if (targetMembership.role === project_member_entity_1.ProjectMemberRole.HOST) {
            throw new common_1.ForbiddenException('No puedes modificar el rol del propietario');
        }
        await this.membersRepository.updateRole(projectId, targetUserId, toMemberRole(role));
        this.projectsGateway.emitPermissionUpdate(projectId, targetUserId, toMemberRole(role));
    }
    async removeMember(actorId, projectId, targetUserId) {
        await this.findMemberOrThrow(projectId, actorId);
        if (targetUserId === actorId) {
            throw new common_1.BadRequestException('No puedes eliminarte a ti mismo');
        }
        const targetMembership = await this.membersRepository.find(projectId, targetUserId);
        if (!targetMembership) {
            throw new common_1.NotFoundException('El usuario no es miembro del proyecto');
        }
        if (targetMembership.role === project_member_entity_1.ProjectMemberRole.HOST) {
            throw new common_1.ForbiddenException('No puedes eliminar al propietario');
        }
        await this.membersRepository.remove(projectId, targetUserId);
        this.projectsGateway.emitUserRemoved(projectId, targetUserId);
    }
};
exports.ProjectMembersService = ProjectMembersService;
exports.ProjectMembersService = ProjectMembersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(project_members_repository_interface_1.PROJECT_MEMBERS_REPOSITORY)),
    __param(1, (0, common_1.Inject)(project_invitations_repository_interface_1.PROJECT_INVITATIONS_REPOSITORY)),
    __param(2, (0, common_1.Inject)(users_repository_interface_1.USERS_REPOSITORY)),
    __param(3, (0, common_1.Inject)(projects_repository_interface_1.PROJECTS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, projects_gateway_1.ProjectsGateway])
], ProjectMembersService);
//# sourceMappingURL=project-members.service.js.map
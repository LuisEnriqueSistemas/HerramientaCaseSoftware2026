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
exports.ProjectMembersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const invite_user_dto_1 = require("./dto/invite-user.dto");
const update_member_role_dto_1 = require("./dto/update-member-role.dto");
const project_members_service_1 = require("./project-members.service");
let ProjectMembersController = class ProjectMembersController {
    projectMembersService;
    constructor(projectMembersService) {
        this.projectMembersService = projectMembersService;
    }
    invite(request, projectId, dto) {
        return this.projectMembersService.inviteUser(request.user.sub, projectId, dto.email, dto.role);
    }
    listMembers(request, projectId) {
        return this.projectMembersService.listMembers(request.user.sub, projectId);
    }
    async updateMemberRole(request, projectId, userId, dto) {
        await this.projectMembersService.updateMemberRole(request.user.sub, projectId, userId, dto.role);
        return { ok: true };
    }
    async removeMember(request, projectId, userId) {
        await this.projectMembersService.removeMember(request.user.sub, projectId, userId);
        return { ok: true };
    }
};
exports.ProjectMembersController = ProjectMembersController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('invitations'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, invite_user_dto_1.InviteUserDto]),
    __metadata("design:returntype", Promise)
], ProjectMembersController.prototype, "invite", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('members'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProjectMembersController.prototype, "listMembers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('members/:userId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('userId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_member_role_dto_1.UpdateMemberRoleDto]),
    __metadata("design:returntype", Promise)
], ProjectMembersController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('members/:userId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProjectMembersController.prototype, "removeMember", null);
exports.ProjectMembersController = ProjectMembersController = __decorate([
    (0, common_1.Controller)('projects/:projectId'),
    __metadata("design:paramtypes", [project_members_service_1.ProjectMembersService])
], ProjectMembersController);
//# sourceMappingURL=project-members.controller.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectInvitation = exports.ProjectInvitationStatus = void 0;
const typeorm_1 = require("typeorm");
const project_member_entity_1 = require("./project-member.entity");
var ProjectInvitationStatus;
(function (ProjectInvitationStatus) {
    ProjectInvitationStatus["PENDING"] = "PENDING";
    ProjectInvitationStatus["ACCEPTED"] = "ACCEPTED";
    ProjectInvitationStatus["REJECTED"] = "REJECTED";
})(ProjectInvitationStatus || (exports.ProjectInvitationStatus = ProjectInvitationStatus = {}));
let ProjectInvitation = class ProjectInvitation {
    id;
    projectId;
    invitedByUserId;
    email;
    role;
    status;
    createdAt;
    updatedAt;
};
exports.ProjectInvitation = ProjectInvitation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProjectInvitation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], ProjectInvitation.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invited_by_user_id' }),
    __metadata("design:type", String)
], ProjectInvitation.prototype, "invitedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProjectInvitation.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: project_member_entity_1.ProjectMemberRole }),
    __metadata("design:type", String)
], ProjectInvitation.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProjectInvitationStatus,
        default: ProjectInvitationStatus.PENDING,
    }),
    __metadata("design:type", String)
], ProjectInvitation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProjectInvitation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProjectInvitation.prototype, "updatedAt", void 0);
exports.ProjectInvitation = ProjectInvitation = __decorate([
    (0, typeorm_1.Entity)('project_invitations')
], ProjectInvitation);
//# sourceMappingURL=project-invitation.entity.js.map
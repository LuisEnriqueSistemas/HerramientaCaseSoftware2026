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
exports.TypeOrmProjectInvitationsRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_invitation_entity_1 = require("../entities/project-invitation.entity");
let TypeOrmProjectInvitationsRepository = class TypeOrmProjectInvitationsRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async createAndSave(data) {
        const invitation = this.repository.create(data);
        return this.repository.save(invitation);
    }
    findById(id) {
        return this.repository.findOne({ where: { id } });
    }
    findPendingByEmail(email) {
        return this.repository.find({
            where: {
                email,
                status: project_invitation_entity_1.ProjectInvitationStatus.PENDING,
            },
            order: { createdAt: 'DESC' },
        });
    }
    findPendingByProjectAndEmail(projectId, email) {
        return this.repository.findOne({
            where: {
                projectId,
                email,
                status: project_invitation_entity_1.ProjectInvitationStatus.PENDING,
            },
        });
    }
    async updateStatus(id, status) {
        const invitation = await this.findById(id);
        if (!invitation) {
            return null;
        }
        invitation.status = status;
        return this.repository.save(invitation);
    }
    async removeByProject(projectId) {
        await this.repository.delete({ projectId });
    }
};
exports.TypeOrmProjectInvitationsRepository = TypeOrmProjectInvitationsRepository;
exports.TypeOrmProjectInvitationsRepository = TypeOrmProjectInvitationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_invitation_entity_1.ProjectInvitation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TypeOrmProjectInvitationsRepository);
//# sourceMappingURL=typeorm-project-invitations.repository.js.map
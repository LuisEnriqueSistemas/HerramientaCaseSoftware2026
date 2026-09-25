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
exports.TypeOrmProjectMembersRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_member_entity_1 = require("../entities/project-member.entity");
let TypeOrmProjectMembersRepository = class TypeOrmProjectMembersRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async add(projectId, userId, role) {
        const member = this.repository.create({ projectId, userId, role });
        return this.repository.save(member);
    }
    find(projectId, userId) {
        return this.repository.findOne({ where: { projectId, userId } });
    }
    listByProject(projectId) {
        return this.repository.find({ where: { projectId } });
    }
    listByUser(userId) {
        return this.repository.find({ where: { userId } });
    }
    async updateRole(projectId, userId, role) {
        const member = await this.find(projectId, userId);
        if (!member) {
            return null;
        }
        member.role = role;
        return this.repository.save(member);
    }
    async remove(projectId, userId) {
        await this.repository.delete({ projectId, userId });
    }
    async removeByProject(projectId) {
        await this.repository.delete({ projectId });
    }
};
exports.TypeOrmProjectMembersRepository = TypeOrmProjectMembersRepository;
exports.TypeOrmProjectMembersRepository = TypeOrmProjectMembersRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_member_entity_1.ProjectMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TypeOrmProjectMembersRepository);
//# sourceMappingURL=typeorm-project-members.repository.js.map
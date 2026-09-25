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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const uml_diagram_repository_interface_1 = require("../uml/repositories/uml-diagram-repository.interface");
const project_member_entity_1 = require("./entities/project-member.entity");
const project_invitations_repository_interface_1 = require("./repositories/project-invitations-repository.interface");
const project_members_repository_interface_1 = require("./repositories/project-members-repository.interface");
const projects_repository_interface_1 = require("./repositories/projects-repository.interface");
const projects_gateway_1 = require("./projects.gateway");
let ProjectsService = class ProjectsService {
    projectsRepository;
    membersRepository;
    invitationsRepository;
    umlDiagramRepository;
    projectsGateway;
    constructor(projectsRepository, membersRepository, invitationsRepository, umlDiagramRepository, projectsGateway) {
        this.projectsRepository = projectsRepository;
        this.membersRepository = membersRepository;
        this.invitationsRepository = invitationsRepository;
        this.umlDiagramRepository = umlDiagramRepository;
        this.projectsGateway = projectsGateway;
    }
    async createProject(userId, name, description) {
        const project = await this.projectsRepository.createAndSave({
            name,
            description,
            createdBy: userId,
        });
        await this.membersRepository.add(project.id, userId, project_member_entity_1.ProjectMemberRole.HOST);
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            role: project_member_entity_1.ProjectMemberRole.HOST,
            createdAt: project.createdAt,
        };
    }
    async listProjectsForUser(userId) {
        const members = await this.membersRepository.listByUser(userId);
        const projects = await this.projectsRepository.findByIds(members.map((member) => member.projectId));
        const byId = new Map(projects.map((project) => [project.id, project]));
        return members
            .map((member) => {
            const project = byId.get(member.projectId);
            if (!project) {
                return null;
            }
            return {
                id: project.id,
                name: project.name,
                description: project.description,
                memberRole: member.role,
                createdAt: project.createdAt,
            };
        })
            .filter((item) => item !== null)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async getMembershipOrThrow(userId, projectId) {
        const [project, membership] = await Promise.all([
            this.projectsRepository.findById(projectId),
            this.membersRepository.find(projectId, userId),
        ]);
        if (!project) {
            throw new common_1.NotFoundException('El proyecto no existe');
        }
        if (!membership) {
            throw new common_1.NotFoundException('No eres miembro de este proyecto');
        }
        return { project, membership };
    }
    async getProjectDetail(userId, projectId) {
        const { project, membership } = await this.getMembershipOrThrow(userId, projectId);
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            createdBy: project.createdBy,
            memberRole: membership.role,
            createdAt: project.createdAt,
        };
    }
    async deleteProject(userId, projectId) {
        const { membership } = await this.getMembershipOrThrow(userId, projectId);
        if (membership.role !== project_member_entity_1.ProjectMemberRole.HOST) {
            throw new common_1.ForbiddenException('No tienes permiso para eliminar este proyecto');
        }
        await this.umlDiagramRepository.deleteDiagramDataByProject(projectId);
        await this.invitationsRepository.removeByProject(projectId);
        await this.membersRepository.removeByProject(projectId);
        await this.projectsRepository.remove(projectId);
        this.projectsGateway.emitProjectDeleted(projectId);
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(projects_repository_interface_1.PROJECTS_REPOSITORY)),
    __param(1, (0, common_1.Inject)(project_members_repository_interface_1.PROJECT_MEMBERS_REPOSITORY)),
    __param(2, (0, common_1.Inject)(project_invitations_repository_interface_1.PROJECT_INVITATIONS_REPOSITORY)),
    __param(3, (0, common_1.Inject)(uml_diagram_repository_interface_1.UML_DIAGRAM_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, projects_gateway_1.ProjectsGateway])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map
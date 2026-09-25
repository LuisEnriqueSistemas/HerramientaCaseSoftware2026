"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const uml_module_1 = require("../uml/uml.module");
const users_module_1 = require("../users/users.module");
const project_entity_1 = require("./entities/project.entity");
const project_invitation_entity_1 = require("./entities/project-invitation.entity");
const project_member_entity_1 = require("./entities/project-member.entity");
const invitations_controller_1 = require("./invitations.controller");
const invitations_service_1 = require("./invitations.service");
const project_members_controller_1 = require("./project-members.controller");
const project_members_service_1 = require("./project-members.service");
const project_invitations_repository_interface_1 = require("./repositories/project-invitations-repository.interface");
const typeorm_project_invitations_repository_1 = require("./repositories/typeorm-project-invitations.repository");
const project_members_repository_interface_1 = require("./repositories/project-members-repository.interface");
const typeorm_project_members_repository_1 = require("./repositories/typeorm-project-members.repository");
const projects_repository_interface_1 = require("./repositories/projects-repository.interface");
const typeorm_projects_repository_1 = require("./repositories/typeorm-projects.repository");
const projects_controller_1 = require("./projects.controller");
const projects_gateway_1 = require("./projects.gateway");
const projects_service_1 = require("./projects.service");
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_entity_1.Project, project_member_entity_1.ProjectMember, project_invitation_entity_1.ProjectInvitation]),
            users_module_1.UsersModule,
            (0, common_1.forwardRef)(() => uml_module_1.UmlModule),
        ],
        controllers: [
            projects_controller_1.ProjectsController,
            project_members_controller_1.ProjectMembersController,
            invitations_controller_1.InvitationsController,
        ],
        providers: [
            { provide: projects_repository_interface_1.PROJECTS_REPOSITORY, useClass: typeorm_projects_repository_1.TypeOrmProjectsRepository },
            {
                provide: project_members_repository_interface_1.PROJECT_MEMBERS_REPOSITORY,
                useClass: typeorm_project_members_repository_1.TypeOrmProjectMembersRepository,
            },
            {
                provide: project_invitations_repository_interface_1.PROJECT_INVITATIONS_REPOSITORY,
                useClass: typeorm_project_invitations_repository_1.TypeOrmProjectInvitationsRepository,
            },
            projects_service_1.ProjectsService,
            project_members_service_1.ProjectMembersService,
            invitations_service_1.InvitationsService,
            projects_gateway_1.ProjectsGateway,
            jwt_auth_guard_1.JwtAuthGuard,
        ],
        exports: [project_members_repository_interface_1.PROJECT_MEMBERS_REPOSITORY],
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map
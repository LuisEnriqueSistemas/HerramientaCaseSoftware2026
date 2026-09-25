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
exports.ProjectsGateway = exports.PROJECT_SOCKET_EVENTS = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const project_members_repository_interface_1 = require("./repositories/project-members-repository.interface");
const application_config_1 = require("../config/application.config");
const clientUrl = (0, application_config_1.getApplicationConfig)().clientUrl;
const userRoom = (userId) => `user:${userId}`;
const projectRoom = (projectId) => `project:${projectId}`;
exports.PROJECT_SOCKET_EVENTS = {
    PROJECT_JOINED: 'project_joined',
    PERMISSIONS_UPDATED: 'permissions_updated',
    USER_REMOVED: 'user_removed',
    PROJECT_DELETED: 'project_deleted',
};
let ProjectsGateway = class ProjectsGateway {
    jwtService;
    membersRepository;
    server;
    constructor(jwtService, membersRepository) {
        this.jwtService = jwtService;
        this.membersRepository = membersRepository;
    }
    getUserId(client) {
        return client.data.userId ?? null;
    }
    async handleConnection(client) {
        const token = client.handshake.auth?.token;
        if (typeof token !== 'string' || token.length === 0) {
            client.disconnect(true);
            return;
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            client.data.userId = payload.sub;
            await client.join(userRoom(payload.sub));
        }
        catch {
            client.disconnect(true);
        }
    }
    async handleJoinProject(client, projectId) {
        const userId = this.getUserId(client);
        if (!userId) {
            return { ok: false };
        }
        if (typeof projectId !== 'string' || projectId.length === 0) {
            return { ok: false };
        }
        const membership = await this.membersRepository.find(projectId, userId);
        if (!membership) {
            return { ok: false };
        }
        await client.join(projectRoom(projectId));
        client.emit(exports.PROJECT_SOCKET_EVENTS.PROJECT_JOINED, {
            ok: true,
            projectId,
            role: membership.role,
        });
        return { ok: true, projectId };
    }
    handleLeaveProject(client, projectId) {
        if (typeof projectId === 'string' && projectId.length > 0) {
            void client.leave(projectRoom(projectId));
        }
    }
    emitPermissionUpdate(projectId, targetUserId, newRole) {
        const payload = { projectId, role: newRole };
        this.server
            .to(userRoom(targetUserId))
            .emit(exports.PROJECT_SOCKET_EVENTS.PERMISSIONS_UPDATED, payload);
    }
    emitUserRemoved(projectId, targetUserId) {
        const sockets = [...this.server.sockets.sockets.values()].filter((socket) => socket.data.userId === targetUserId);
        const payload = { projectId };
        this.server
            .to(userRoom(targetUserId))
            .emit(exports.PROJECT_SOCKET_EVENTS.USER_REMOVED, payload);
        for (const socket of sockets) {
            socket.disconnect(true);
        }
    }
    emitProjectDeleted(projectId) {
        const room = projectRoom(projectId);
        const payload = { projectId };
        this.server.to(room).emit(exports.PROJECT_SOCKET_EVENTS.PROJECT_DELETED, payload);
        for (const socket of this.server.sockets.sockets.values()) {
            if (socket.rooms.has(room)) {
                socket.disconnect(true);
            }
        }
    }
};
exports.ProjectsGateway = ProjectsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ProjectsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_project'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ProjectsGateway.prototype, "handleJoinProject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_project'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ProjectsGateway.prototype, "handleLeaveProject", null);
exports.ProjectsGateway = ProjectsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: clientUrl },
    }),
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(project_members_repository_interface_1.PROJECT_MEMBERS_REPOSITORY)),
    __metadata("design:paramtypes", [jwt_1.JwtService, Object])
], ProjectsGateway);
//# sourceMappingURL=projects.gateway.js.map
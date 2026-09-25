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
exports.UmlGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const uml_operation_types_1 = require("./interfaces/uml-operation.types");
const uml_diagram_service_1 = require("./uml-diagram.service");
const application_config_1 = require("../config/application.config");
const projectRoom = (projectId) => `project:${projectId}`;
const clientUrl = (0, application_config_1.getApplicationConfig)().clientUrl;
let UmlGateway = class UmlGateway {
    umlDiagramService;
    server;
    constructor(umlDiagramService) {
        this.umlDiagramService = umlDiagramService;
    }
    async handleDiagramTypeUpdated(client, payload) {
        const userId = this.userIdOf(client);
        const result = await this.execute(userId, () => this.umlDiagramService.applyDiagramType(userId, payload));
        if (!this.isOk(result)) {
            return result;
        }
        const event = result;
        this.server
            .to(projectRoom(result.projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.DIAGRAM_TYPE_UPDATED, event);
        return { ok: true };
    }
    emitDiagramGenerated(projectId, diagram) {
        this.server
            .to(projectRoom(projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.DIAGRAM_GENERATED, { projectId, diagram });
    }
    userIdOf(client) {
        return client.data.userId ?? null;
    }
    errorMessage(error) {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return 'Operación no válida';
    }
    async execute(userId, operation) {
        if (!userId) {
            return { ok: false, error: 'No autenticado' };
        }
        try {
            return await operation();
        }
        catch (error) {
            return { ok: false, error: this.errorMessage(error) };
        }
    }
    async handleNodeAdded(client, payload) {
        const userId = this.userIdOf(client);
        const result = await this.execute(userId, () => this.umlDiagramService.applyNodeAdded(userId, payload));
        if (!this.isOk(result)) {
            return result;
        }
        const event = {
            projectId: result.projectId,
            node: result.node,
            version: result.version,
        };
        this.server
            .to(projectRoom(result.projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.NODE_ADDED, event);
        return { ok: true };
    }
    async handleNodeUpdated(client, payload) {
        const userId = this.userIdOf(client);
        const result = await this.execute(userId, () => this.umlDiagramService.applyNodeUpdated(userId, payload));
        if (!this.isOk(result)) {
            return result;
        }
        const event = {
            projectId: result.projectId,
            node: result.node,
            version: result.version,
        };
        this.server
            .to(projectRoom(result.projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.NODE_UPDATED, event);
        return { ok: true };
    }
    async handleNodeDeleted(client, payload) {
        const userId = this.userIdOf(client);
        const result = await this.execute(userId, () => this.umlDiagramService.applyNodeDeleted(userId, payload));
        if (!this.isOk(result)) {
            return result;
        }
        const event = {
            projectId: result.projectId,
            nodeId: result.nodeId,
            deletedRelationIds: result.deletedRelationIds,
            version: result.version,
        };
        this.server
            .to(projectRoom(result.projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.NODE_DELETED, event);
        return { ok: true };
    }
    async handleRelationAdded(client, payload) {
        const userId = this.userIdOf(client);
        const result = await this.execute(userId, () => this.umlDiagramService.applyRelationAdded(userId, payload));
        if (!this.isOk(result)) {
            return result;
        }
        const event = {
            projectId: result.projectId,
            edge: result.edge,
            version: result.version,
        };
        this.server
            .to(projectRoom(result.projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.RELATION_ADDED, event);
        return { ok: true };
    }
    async handleRelationUpdated(client, payload) {
        const userId = this.userIdOf(client);
        const result = await this.execute(userId, () => this.umlDiagramService.applyRelationUpdated(userId, payload));
        if (!this.isOk(result)) {
            return result;
        }
        const event = {
            projectId: result.projectId,
            edge: result.edge,
            version: result.version,
        };
        this.server
            .to(projectRoom(result.projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.RELATION_UPDATED, event);
        return { ok: true };
    }
    async handleRelationDeleted(client, payload) {
        const userId = this.userIdOf(client);
        const result = await this.execute(userId, () => this.umlDiagramService.applyRelationDeleted(userId, payload));
        if (!this.isOk(result)) {
            return result;
        }
        const event = {
            projectId: result.projectId,
            edgeId: result.edgeId,
            version: result.version,
        };
        this.server
            .to(projectRoom(result.projectId))
            .emit(uml_operation_types_1.UML_SOCKET_EVENTS.RELATION_DELETED, event);
        return { ok: true };
    }
    isOk(result) {
        return (typeof result === 'object' &&
            result !== null &&
            !('ok' in result && result.ok === false));
    }
};
exports.UmlGateway = UmlGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], UmlGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(uml_operation_types_1.UML_SOCKET_EVENTS.DIAGRAM_TYPE_UPDATED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], UmlGateway.prototype, "handleDiagramTypeUpdated", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(uml_operation_types_1.UML_SOCKET_EVENTS.NODE_ADDED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], UmlGateway.prototype, "handleNodeAdded", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(uml_operation_types_1.UML_SOCKET_EVENTS.NODE_UPDATED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], UmlGateway.prototype, "handleNodeUpdated", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(uml_operation_types_1.UML_SOCKET_EVENTS.NODE_DELETED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], UmlGateway.prototype, "handleNodeDeleted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(uml_operation_types_1.UML_SOCKET_EVENTS.RELATION_ADDED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], UmlGateway.prototype, "handleRelationAdded", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(uml_operation_types_1.UML_SOCKET_EVENTS.RELATION_UPDATED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], UmlGateway.prototype, "handleRelationUpdated", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(uml_operation_types_1.UML_SOCKET_EVENTS.RELATION_DELETED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], UmlGateway.prototype, "handleRelationDeleted", null);
exports.UmlGateway = UmlGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/',
        cors: { origin: clientUrl },
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [uml_diagram_service_1.UmlDiagramService])
], UmlGateway);
//# sourceMappingURL=uml.gateway.js.map
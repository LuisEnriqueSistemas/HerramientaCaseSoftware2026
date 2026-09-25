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
exports.AiStatusController = exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ai_assistant_service_1 = require("./ai-assistant.service");
const deepseek_service_1 = require("./deepseek.service");
let AiController = class AiController {
    aiAssistantService;
    deepseekService;
    constructor(aiAssistantService, deepseekService) {
        this.aiAssistantService = aiAssistantService;
        this.deepseekService = deepseekService;
    }
    generateFromPrompt(request, projectId, body) {
        return this.aiAssistantService.generateFromPrompt(request.user.sub, projectId, body.prompt ?? '');
    }
    generateFromAudio(request, projectId, file) {
        return this.aiAssistantService.generateFromAudio(request.user.sub, projectId, file);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('prompt'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateFromPrompt", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('audio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateFromAudio", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('projects/:projectId/ai'),
    __metadata("design:paramtypes", [ai_assistant_service_1.AiAssistantService,
        deepseek_service_1.DeepseekService])
], AiController);
let AiStatusController = class AiStatusController {
    deepseekService;
    constructor(deepseekService) {
        this.deepseekService = deepseekService;
    }
    getStatus() {
        return this.deepseekService.getStatus();
    }
};
exports.AiStatusController = AiStatusController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiStatusController.prototype, "getStatus", null);
exports.AiStatusController = AiStatusController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [deepseek_service_1.DeepseekService])
], AiStatusController);
//# sourceMappingURL=ai.controller.js.map
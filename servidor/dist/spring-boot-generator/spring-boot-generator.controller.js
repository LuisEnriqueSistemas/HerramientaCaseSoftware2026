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
exports.SpringBootGeneratorController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const spring_boot_generator_service_1 = require("./spring-boot-generator.service");
let SpringBootGeneratorController = class SpringBootGeneratorController {
    generatorService;
    constructor(generatorService) {
        this.generatorService = generatorService;
    }
    async generateSpringBoot(request, projectId, deps, basePackage, artifactId, groupId) {
        const result = await this.generatorService.generateZip(request.user.sub, projectId, {
            deps: deps
                ? deps
                    .split(',')
                    .map((d) => d.trim())
                    .filter(Boolean)
                : [],
            basePackage,
            artifactId,
            groupId,
        });
        return new common_1.StreamableFile(result.buffer, {
            type: 'application/octet-stream',
            disposition: `attachment; filename="${result.filename}"`,
        });
    }
};
exports.SpringBootGeneratorController = SpringBootGeneratorController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('spring-boot'),
    (0, common_1.Header)('Content-Type', 'application/octet-stream'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('deps')),
    __param(3, (0, common_1.Query)('package')),
    __param(4, (0, common_1.Query)('artifact')),
    __param(5, (0, common_1.Query)('group')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SpringBootGeneratorController.prototype, "generateSpringBoot", null);
exports.SpringBootGeneratorController = SpringBootGeneratorController = __decorate([
    (0, common_1.Controller)('projects/:projectId/generate'),
    __metadata("design:paramtypes", [spring_boot_generator_service_1.SpringBootGeneratorService])
], SpringBootGeneratorController);
//# sourceMappingURL=spring-boot-generator.controller.js.map
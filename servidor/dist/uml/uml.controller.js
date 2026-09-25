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
exports.UmlController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const uml_diagram_service_1 = require("./uml-diagram.service");
const uml_xsd_export_service_1 = require("./xsd/uml-xsd-export.service");
const uml_xmi_export_service_1 = require("./xmi/uml-xmi-export.service");
const ea_xmi_export_service_1 = require("./ea-xmi/ea-xmi-export.service");
let UmlController = class UmlController {
    umlDiagramService;
    xsdExportService;
    xmiExportService;
    eaXmiExportService;
    constructor(umlDiagramService, xsdExportService, xmiExportService, eaXmiExportService) {
        this.umlDiagramService = umlDiagramService;
        this.xsdExportService = xsdExportService;
        this.xmiExportService = xmiExportService;
        this.eaXmiExportService = eaXmiExportService;
    }
    getDiagram(request, projectId) {
        return this.umlDiagramService.getDiagram(request.user.sub, projectId);
    }
    async exportDiagram(request, projectId, format, response) {
        if (format !== undefined &&
            format !== 'xsd' &&
            format !== 'xmi' &&
            format !== 'ea-xmi-1.1') {
            throw new common_1.BadRequestException(`Formato no soportado: ${format}`);
        }
        const diagram = await this.umlDiagramService.getDiagram(request.user.sub, projectId);
        if (format === 'ea-xmi-1.1') {
            const xmi = this.eaXmiExportService.buildXmi(diagram);
            response.set({
                'Content-Type': 'application/xml; charset=utf-8',
                'Content-Disposition': `attachment; filename="modelo-${projectId}-ea.xmi"`,
            });
            return xmi;
        }
        if (format === 'xmi') {
            const xmi = this.xmiExportService.buildXmi(diagram);
            response.set({
                'Content-Type': 'application/vnd.omg.xmi+xml; charset=utf-8',
                'Content-Disposition': `attachment; filename="modelo-${projectId}.xmi"`,
            });
            return xmi;
        }
        const xsd = this.xsdExportService.buildXsd(diagram);
        response.set({
            'Content-Type': 'text/xml; charset=utf-8',
            'Content-Disposition': `attachment; filename="modelo-${projectId}.xsd"`,
        });
        return xsd;
    }
};
exports.UmlController = UmlController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':projectId/diagram'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UmlController.prototype, "getDiagram", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':projectId/diagram/export'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], UmlController.prototype, "exportDiagram", null);
exports.UmlController = UmlController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [uml_diagram_service_1.UmlDiagramService,
        uml_xsd_export_service_1.UmlXsdExportService,
        uml_xmi_export_service_1.UmlXmiExportService,
        ea_xmi_export_service_1.EaXmiExportService])
], UmlController);
//# sourceMappingURL=uml.controller.js.map
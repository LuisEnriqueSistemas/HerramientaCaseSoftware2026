"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UmlModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const projects_module_1 = require("../projects/projects.module");
const uml_class_node_entity_1 = require("./entities/uml-class-node.entity");
const uml_diagram_entity_1 = require("./entities/uml-diagram.entity");
const uml_relation_entity_1 = require("./entities/uml-relation.entity");
const typeorm_uml_diagram_repository_1 = require("./repositories/typeorm-uml-diagram.repository");
const uml_diagram_repository_interface_1 = require("./repositories/uml-diagram-repository.interface");
const uml_controller_1 = require("./uml.controller");
const uml_diagram_service_1 = require("./uml-diagram.service");
const uml_gateway_1 = require("./uml.gateway");
const uml_xsd_export_service_1 = require("./xsd/uml-xsd-export.service");
const uml_xmi_export_service_1 = require("./xmi/uml-xmi-export.service");
const ea_xmi_export_service_1 = require("./ea-xmi/ea-xmi-export.service");
let UmlModule = class UmlModule {
};
exports.UmlModule = UmlModule;
exports.UmlModule = UmlModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([uml_diagram_entity_1.UmlDiagram, uml_class_node_entity_1.UmlClassNode, uml_relation_entity_1.UmlRelation]),
            (0, common_1.forwardRef)(() => projects_module_1.ProjectsModule),
        ],
        controllers: [uml_controller_1.UmlController],
        providers: [
            {
                provide: uml_diagram_repository_interface_1.UML_DIAGRAM_REPOSITORY,
                useClass: typeorm_uml_diagram_repository_1.TypeOrmUmlDiagramRepository,
            },
            uml_diagram_service_1.UmlDiagramService,
            uml_gateway_1.UmlGateway,
            uml_xsd_export_service_1.UmlXsdExportService,
            uml_xmi_export_service_1.UmlXmiExportService,
            ea_xmi_export_service_1.EaXmiExportService,
            jwt_auth_guard_1.JwtAuthGuard,
        ],
        exports: [uml_diagram_service_1.UmlDiagramService, uml_gateway_1.UmlGateway, uml_diagram_repository_interface_1.UML_DIAGRAM_REPOSITORY],
    })
], UmlModule);
//# sourceMappingURL=uml.module.js.map
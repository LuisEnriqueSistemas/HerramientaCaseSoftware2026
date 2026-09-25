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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UmlDiagram = exports.UmlDiagramModelType = void 0;
const typeorm_1 = require("typeorm");
var UmlDiagramModelType;
(function (UmlDiagramModelType) {
    UmlDiagramModelType["CLASS"] = "CLASS";
    UmlDiagramModelType["ER_LOGICAL"] = "ER_LOGICAL";
})(UmlDiagramModelType || (exports.UmlDiagramModelType = UmlDiagramModelType = {}));
let UmlDiagram = class UmlDiagram {
    id;
    projectId;
    version;
    modelType;
    createdAt;
    updatedAt;
};
exports.UmlDiagram = UmlDiagram;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UmlDiagram.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('uq_uml_diagrams_project_id', { unique: true }),
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], UmlDiagram.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], UmlDiagram.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'model_type',
        type: 'enum',
        enum: UmlDiagramModelType,
        default: UmlDiagramModelType.ER_LOGICAL,
    }),
    __metadata("design:type", String)
], UmlDiagram.prototype, "modelType", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UmlDiagram.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UmlDiagram.prototype, "updatedAt", void 0);
exports.UmlDiagram = UmlDiagram = __decorate([
    (0, typeorm_1.Entity)('uml_diagrams')
], UmlDiagram);
//# sourceMappingURL=uml-diagram.entity.js.map
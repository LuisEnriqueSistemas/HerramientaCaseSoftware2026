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
exports.UmlRelation = exports.UmlRelationType = void 0;
const typeorm_1 = require("typeorm");
var UmlRelationType;
(function (UmlRelationType) {
    UmlRelationType["ASSOCIATION"] = "ASSOCIATION";
    UmlRelationType["INHERITANCE"] = "INHERITANCE";
    UmlRelationType["REALIZATION"] = "REALIZATION";
    UmlRelationType["AGGREGATION"] = "AGGREGATION";
    UmlRelationType["COMPOSITION"] = "COMPOSITION";
    UmlRelationType["DEPENDENCY"] = "DEPENDENCY";
})(UmlRelationType || (exports.UmlRelationType = UmlRelationType = {}));
let UmlRelation = class UmlRelation {
    id;
    diagramId;
    sourceNodeId;
    targetNodeId;
    type;
    sourceMin;
    sourceMax;
    targetMin;
    targetMax;
    sourceRole;
    targetRole;
    createdAt;
    updatedAt;
};
exports.UmlRelation = UmlRelation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UmlRelation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'diagram_id' }),
    __metadata("design:type", String)
], UmlRelation.prototype, "diagramId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_node_id' }),
    __metadata("design:type", String)
], UmlRelation.prototype, "sourceNodeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_node_id' }),
    __metadata("design:type", String)
], UmlRelation.prototype, "targetNodeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UmlRelationType }),
    __metadata("design:type", String)
], UmlRelation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_min', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], UmlRelation.prototype, "sourceMin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_max', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], UmlRelation.prototype, "sourceMax", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_min', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], UmlRelation.prototype, "targetMin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_max', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], UmlRelation.prototype, "targetMax", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_role', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], UmlRelation.prototype, "sourceRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_role', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], UmlRelation.prototype, "targetRole", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UmlRelation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UmlRelation.prototype, "updatedAt", void 0);
exports.UmlRelation = UmlRelation = __decorate([
    (0, typeorm_1.Entity)('uml_relations')
], UmlRelation);
//# sourceMappingURL=uml-relation.entity.js.map
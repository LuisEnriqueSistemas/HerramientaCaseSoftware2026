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
exports.UmlClassNode = void 0;
const typeorm_1 = require("typeorm");
let UmlClassNode = class UmlClassNode {
    id;
    diagramId;
    name;
    tableName;
    description;
    positionX;
    positionY;
    attributes;
    methods;
    createdAt;
    updatedAt;
};
exports.UmlClassNode = UmlClassNode;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UmlClassNode.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'diagram_id' }),
    __metadata("design:type", String)
], UmlClassNode.prototype, "diagramId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], UmlClassNode.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'table_name',
        type: 'varchar',
        length: 120,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UmlClassNode.prototype, "tableName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UmlClassNode.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'position_x', type: 'float' }),
    __metadata("design:type", Number)
], UmlClassNode.prototype, "positionX", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'position_y', type: 'float' }),
    __metadata("design:type", Number)
], UmlClassNode.prototype, "positionY", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], UmlClassNode.prototype, "attributes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], UmlClassNode.prototype, "methods", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UmlClassNode.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UmlClassNode.prototype, "updatedAt", void 0);
exports.UmlClassNode = UmlClassNode = __decorate([
    (0, typeorm_1.Entity)('uml_classes')
], UmlClassNode);
//# sourceMappingURL=uml-class-node.entity.js.map
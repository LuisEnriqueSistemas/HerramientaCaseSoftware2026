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
exports.TypeOrmUmlDiagramRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uml_class_node_entity_1 = require("../entities/uml-class-node.entity");
const uml_diagram_entity_1 = require("../entities/uml-diagram.entity");
const uml_relation_entity_1 = require("../entities/uml-relation.entity");
let TypeOrmUmlDiagramRepository = class TypeOrmUmlDiagramRepository {
    diagramsRepository;
    classesRepository;
    relationsRepository;
    constructor(diagramsRepository, classesRepository, relationsRepository) {
        this.diagramsRepository = diagramsRepository;
        this.classesRepository = classesRepository;
        this.relationsRepository = relationsRepository;
    }
    async findOrCreateForProject(projectId) {
        const existing = await this.diagramsRepository.findOne({
            where: { projectId },
        });
        if (existing) {
            return existing;
        }
        const diagram = this.diagramsRepository.create({ projectId });
        return this.diagramsRepository.save(diagram);
    }
    saveDiagram(diagram) {
        return this.diagramsRepository.save(diagram);
    }
    listClasses(diagramId) {
        return this.classesRepository.find({ where: { diagramId } });
    }
    listRelations(diagramId) {
        return this.relationsRepository.find({ where: { diagramId } });
    }
    findClassById(id) {
        return this.classesRepository.findOne({ where: { id } });
    }
    findRelationById(id) {
        return this.relationsRepository.findOne({ where: { id } });
    }
    saveClass(node) {
        return this.classesRepository.save(node);
    }
    saveRelation(relation) {
        return this.relationsRepository.save(relation);
    }
    async deleteNode(diagramId, nodeId) {
        await this.classesRepository.delete({ id: nodeId, diagramId });
    }
    async deleteRelationsFromNode(diagramId, nodeId) {
        const relations = await this.relationsRepository.find({
            where: [
                { diagramId, sourceNodeId: nodeId },
                { diagramId, targetNodeId: nodeId },
            ],
        });
        if (relations.length > 0) {
            await this.relationsRepository.delete({
                diagramId,
                id: (0, typeorm_2.In)(relations.map((relation) => relation.id)),
            });
        }
        return relations;
    }
    async deleteRelation(diagramId, edgeId) {
        await this.relationsRepository.delete({ id: edgeId, diagramId });
    }
    async deleteDiagramDataByProject(projectId) {
        const diagram = await this.diagramsRepository.findOne({
            where: { projectId },
        });
        if (!diagram) {
            return;
        }
        await this.relationsRepository.delete({ diagramId: diagram.id });
        await this.classesRepository.delete({ diagramId: diagram.id });
        await this.diagramsRepository.delete(diagram.id);
    }
};
exports.TypeOrmUmlDiagramRepository = TypeOrmUmlDiagramRepository;
exports.TypeOrmUmlDiagramRepository = TypeOrmUmlDiagramRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(uml_diagram_entity_1.UmlDiagram)),
    __param(1, (0, typeorm_1.InjectRepository)(uml_class_node_entity_1.UmlClassNode)),
    __param(2, (0, typeorm_1.InjectRepository)(uml_relation_entity_1.UmlRelation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TypeOrmUmlDiagramRepository);
//# sourceMappingURL=typeorm-uml-diagram.repository.js.map
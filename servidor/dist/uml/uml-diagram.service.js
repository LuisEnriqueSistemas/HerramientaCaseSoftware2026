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
exports.UmlDiagramService = void 0;
const common_1 = require("@nestjs/common");
const project_member_entity_1 = require("../projects/entities/project-member.entity");
const project_members_repository_interface_1 = require("../projects/repositories/project-members-repository.interface");
const uml_diagram_entity_1 = require("./entities/uml-diagram.entity");
const uml_relation_entity_1 = require("./entities/uml-relation.entity");
const uml_operation_types_1 = require("./interfaces/uml-operation.types");
const uml_diagram_repository_interface_1 = require("./repositories/uml-diagram-repository.interface");
const VISIBILITIES = ['public', 'private', 'protected'];
const VALID_RELATION_TYPES = [
    uml_relation_entity_1.UmlRelationType.ASSOCIATION,
    uml_relation_entity_1.UmlRelationType.INHERITANCE,
    uml_relation_entity_1.UmlRelationType.REALIZATION,
    uml_relation_entity_1.UmlRelationType.AGGREGATION,
    uml_relation_entity_1.UmlRelationType.COMPOSITION,
    uml_relation_entity_1.UmlRelationType.DEPENDENCY,
];
const ER_DATA_TYPES = new Set([
    'INT',
    'SMALLINT',
    'BIGINT',
    'DECIMAL',
    'NUMERIC',
    'FLOAT',
    'DOUBLE',
    'CHAR',
    'VARCHAR',
    'TEXT',
    'DATE',
    'TIME',
    'DATETIME',
    'TIMESTAMP',
    'BOOLEAN',
    'BIT',
    'BLOB',
    'VARBINARY',
    'UUID',
]);
let UmlDiagramService = class UmlDiagramService {
    membersRepository;
    diagramRepository;
    constructor(membersRepository, diagramRepository) {
        this.membersRepository = membersRepository;
        this.diagramRepository = diagramRepository;
    }
    async getDiagram(userId, projectId) {
        this.assertProjectId(projectId);
        const membership = await this.getMembershipOrThrow(userId, projectId);
        const diagram = await this.diagramRepository.findOrCreateForProject(projectId);
        const [classes, relations] = await Promise.all([
            this.diagramRepository.listClasses(diagram.id),
            this.diagramRepository.listRelations(diagram.id),
        ]);
        return {
            diagramId: diagram.id,
            projectId,
            version: diagram.version,
            modelType: uml_diagram_entity_1.UmlDiagramModelType.ER_LOGICAL,
            canEdit: membership.role !== project_member_entity_1.ProjectMemberRole.VIEWER,
            nodes: classes.map((node) => this.toNodeResponse(node)),
            edges: relations.map((edge) => this.toEdgeResponse(edge)),
        };
    }
    async applyDiagramType(userId, payload) {
        const parsed = this.parsePayload(payload);
        this.assertProjectId(parsed.projectId);
        await this.requireEditor(userId, parsed.projectId);
        if (parsed.modelType !== uml_diagram_entity_1.UmlDiagramModelType.ER_LOGICAL) {
            throw new common_1.BadRequestException('El diagramador solo admite el modelo ER lógico');
        }
        const diagram = await this.diagramRepository.findOrCreateForProject(parsed.projectId);
        diagram.modelType = uml_diagram_entity_1.UmlDiagramModelType.ER_LOGICAL;
        const saved = await this.bumpVersion(diagram);
        return {
            projectId: parsed.projectId,
            modelType: uml_diagram_entity_1.UmlDiagramModelType.ER_LOGICAL,
            version: saved,
        };
    }
    async applyGeneratedDiagram(userId, projectId, structure) {
        this.assertProjectId(projectId);
        await this.requireEditor(userId, projectId);
        if (!Array.isArray(structure.classes) || structure.classes.length === 0) {
            throw new common_1.BadRequestException('La IA no generó clases para el diagrama');
        }
        if (!Array.isArray(structure.relations)) {
            throw new common_1.BadRequestException('Las relaciones generadas no son válidas');
        }
        const diagram = await this.diagramRepository.findOrCreateForProject(projectId);
        const existingClasses = await this.diagramRepository.listClasses(diagram.id);
        const classByName = new Map(existingClasses.map((node) => [node.name.toLowerCase(), node]));
        for (const [index, generated] of structure.classes.entries()) {
            if (!generated || typeof generated !== 'object') {
                throw new common_1.BadRequestException('Clase generada inválida');
            }
            const name = this.assertName(generated?.name, 'Nombre de clase');
            const existing = classByName.get(name.toLowerCase());
            const normalizedAttributes = this.normalizeGeneratedAttributeTypes(generated.attributes);
            const node = {
                ...(existing ?? {}),
                id: existing?.id ?? crypto.randomUUID(),
                diagramId: diagram.id,
                name,
                positionX: this.assertNumber(generated.x ?? 120 + (index % 3) * 260, 'Posición X'),
                positionY: this.assertNumber(generated.y ?? 120 + Math.floor(index / 3) * 220, 'Posición Y'),
                attributes: this.parseAttributes(normalizedAttributes),
                methods: this.parseMethods(generated.methods),
            };
            const saved = await this.diagramRepository.saveClass(node);
            classByName.set(name.toLowerCase(), saved);
        }
        const existingRelations = await this.diagramRepository.listRelations(diagram.id);
        for (const generated of structure.relations) {
            if (!generated ||
                typeof generated.source !== 'string' ||
                typeof generated.target !== 'string') {
                throw new common_1.BadRequestException('Relación generada inválida');
            }
            const source = classByName.get(generated.source.trim().toLowerCase());
            const target = classByName.get(generated.target.trim().toLowerCase());
            if (!source || !target) {
                throw new common_1.BadRequestException('La relación referencia una clase inexistente');
            }
            this.assertRelationType(generated.type);
            const duplicate = existingRelations.some((relation) => relation.sourceNodeId === source.id &&
                relation.targetNodeId === target.id &&
                relation.type === generated.type);
            if (duplicate) {
                continue;
            }
            const edge = this.parseEdgeInput({
                id: crypto.randomUUID(),
                sourceId: source.id,
                targetId: target.id,
                type: generated.type,
                sourceMin: generated.sourceMin,
                sourceMax: generated.sourceMax,
                targetMin: generated.targetMin,
                targetMax: generated.targetMax,
                sourceRole: generated.sourceRole,
                targetRole: generated.targetRole,
            });
            const sourceMin = edge.sourceMin ?? 1;
            const targetMin = edge.targetMin ?? 1;
            const saved = await this.diagramRepository.saveRelation({
                id: edge.id,
                diagramId: diagram.id,
                sourceNodeId: source.id,
                targetNodeId: target.id,
                type: edge.type,
                sourceMin,
                sourceMax: edge.sourceMax === undefined ? sourceMin : edge.sourceMax,
                targetMin,
                targetMax: edge.targetMax === undefined ? targetMin : edge.targetMax,
                sourceRole: edge.sourceRole ?? null,
                targetRole: edge.targetRole ?? null,
            });
            existingRelations.push(saved);
        }
        await this.bumpVersion(diagram);
        return this.getDiagram(userId, projectId);
    }
    async applyNodeAdded(userId, payload) {
        const { projectId, node } = this.parsePayload(payload);
        await this.requireEditor(userId, projectId);
        const input = this.parseNodeInput(node);
        const diagram = await this.diagramRepository.findOrCreateForProject(projectId);
        await this.validateErAttributes(diagram.id, input.attributes ?? []);
        const existing = await this.diagramRepository.findClassById(input.id);
        if (existing) {
            throw new common_1.BadRequestException('El nodo ya existe en el diagrama');
        }
        const saved = await this.diagramRepository.saveClass({
            id: input.id,
            diagramId: diagram.id,
            name: input.name,
            tableName: input.tableName ?? null,
            description: input.description ?? null,
            positionX: input.x,
            positionY: input.y,
            attributes: input.attributes,
            methods: input.methods,
        });
        const version = await this.bumpVersion(diagram);
        return { projectId, node: this.toNodeResponse(saved), version };
    }
    async applyNodeUpdated(userId, payload) {
        const parsed = this.parsePayload(payload);
        await this.requireEditor(userId, parsed.projectId);
        const nodeId = this.assertUuid(parsed.nodeId, 'Nodo');
        const patch = this.parseNodePatch(parsed.patch);
        const diagram = await this.diagramRepository.findOrCreateForProject(parsed.projectId);
        const existing = await this.findNodeInDiagram(diagram.id, nodeId);
        if (patch.attributes !== undefined) {
            await this.validateErAttributes(diagram.id, patch.attributes);
        }
        const merged = {
            ...existing,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.tableName !== undefined ? { tableName: patch.tableName } : {}),
            ...(patch.description !== undefined
                ? { description: patch.description }
                : {}),
            ...(patch.x !== undefined ? { positionX: patch.x } : {}),
            ...(patch.y !== undefined ? { positionY: patch.y } : {}),
            ...(patch.attributes !== undefined
                ? { attributes: patch.attributes }
                : {}),
            ...(patch.methods !== undefined ? { methods: patch.methods } : {}),
        };
        const saved = await this.diagramRepository.saveClass(merged);
        const version = await this.bumpVersion(diagram);
        return {
            projectId: parsed.projectId,
            node: this.toNodeResponse(saved),
            version,
        };
    }
    async applyNodeDeleted(userId, payload) {
        const parsed = this.parsePayload(payload);
        await this.requireEditor(userId, parsed.projectId);
        const nodeId = this.assertUuid(parsed.nodeId, 'Nodo');
        const diagram = await this.diagramRepository.findOrCreateForProject(parsed.projectId);
        await this.findNodeInDiagram(diagram.id, nodeId);
        const deletedRelations = await this.diagramRepository.deleteRelationsFromNode(diagram.id, nodeId);
        await this.diagramRepository.deleteNode(diagram.id, nodeId);
        const version = await this.bumpVersion(diagram);
        return {
            projectId: parsed.projectId,
            nodeId,
            deletedRelationIds: deletedRelations.map((relation) => relation.id),
            version,
        };
    }
    async applyRelationAdded(userId, payload) {
        const { projectId, edge } = this.parsePayload(payload);
        await this.requireEditor(userId, projectId);
        const input = this.parseEdgeInput(edge);
        const diagram = await this.diagramRepository.findOrCreateForProject(projectId);
        const source = await this.findNodeInDiagram(diagram.id, input.sourceId);
        await this.findNodeInDiagram(diagram.id, input.targetId);
        const existing = await this.diagramRepository.findRelationById(input.id);
        if (existing) {
            throw new common_1.BadRequestException('La relación ya existe en el diagrama');
        }
        void source;
        const sourceMin = input.sourceMin ?? 1;
        const sourceMax = input.sourceMax === undefined ? sourceMin : input.sourceMax;
        const targetMin = input.targetMin ?? 1;
        const targetMax = input.targetMax === undefined ? targetMin : input.targetMax;
        const saved = await this.diagramRepository.saveRelation({
            id: input.id,
            diagramId: diagram.id,
            sourceNodeId: input.sourceId,
            targetNodeId: input.targetId,
            type: input.type,
            sourceMin,
            sourceMax,
            targetMin,
            targetMax,
            sourceRole: input.sourceRole ?? null,
            targetRole: input.targetRole ?? null,
        });
        const version = await this.bumpVersion(diagram);
        return { projectId, edge: this.toEdgeResponse(saved), version };
    }
    async applyRelationUpdated(userId, payload) {
        const parsed = this.parsePayload(payload);
        await this.requireEditor(userId, parsed.projectId);
        const edgeId = this.assertUuid(parsed.edgeId, 'Relación');
        const patch = this.parseRelationPatch(parsed.patch);
        const diagram = await this.diagramRepository.findOrCreateForProject(parsed.projectId);
        const existing = await this.diagramRepository.findRelationById(edgeId);
        if (!existing || existing.diagramId !== diagram.id) {
            throw new common_1.NotFoundException('Relación no encontrada');
        }
        const merged = {
            ...existing,
            ...(patch.type !== undefined ? { type: patch.type } : {}),
            ...(patch.sourceMin !== undefined ? { sourceMin: patch.sourceMin } : {}),
            ...(patch.sourceMax !== undefined ? { sourceMax: patch.sourceMax } : {}),
            ...(patch.targetMin !== undefined ? { targetMin: patch.targetMin } : {}),
            ...(patch.targetMax !== undefined ? { targetMax: patch.targetMax } : {}),
            ...(patch.sourceRole !== undefined
                ? { sourceRole: patch.sourceRole }
                : {}),
            ...(patch.targetRole !== undefined
                ? { targetRole: patch.targetRole }
                : {}),
        };
        const saved = await this.diagramRepository.saveRelation(merged);
        const version = await this.bumpVersion(diagram);
        return {
            projectId: parsed.projectId,
            edge: this.toEdgeResponse(saved),
            version,
        };
    }
    async applyRelationDeleted(userId, payload) {
        const parsed = this.parsePayload(payload);
        await this.requireEditor(userId, parsed.projectId);
        const edgeId = this.assertUuid(parsed.edgeId, 'Relación');
        const diagram = await this.diagramRepository.findOrCreateForProject(parsed.projectId);
        const existing = await this.diagramRepository.findRelationById(edgeId);
        if (!existing || existing.diagramId !== diagram.id) {
            throw new common_1.NotFoundException('Relación no encontrada');
        }
        await this.diagramRepository.deleteRelation(diagram.id, edgeId);
        const version = await this.bumpVersion(diagram);
        return { projectId: parsed.projectId, edgeId, version };
    }
    async getMembershipOrThrow(userId, projectId) {
        const membership = await this.membersRepository.find(projectId, userId);
        if (!membership) {
            throw new common_1.NotFoundException('Proyecto no encontrado');
        }
        return membership;
    }
    async requireEditor(userId, projectId) {
        const membership = await this.getMembershipOrThrow(userId, projectId);
        if (membership.role === project_member_entity_1.ProjectMemberRole.VIEWER) {
            throw new common_1.ForbiddenException('No tienes permisos de edición en este diagrama');
        }
    }
    async findNodeInDiagram(diagramId, nodeId) {
        const node = await this.diagramRepository.findClassById(nodeId);
        if (!node || node.diagramId !== diagramId) {
            throw new common_1.NotFoundException('Nodo no encontrado');
        }
        return node;
    }
    async bumpVersion(diagram) {
        diagram.version += 1;
        await this.diagramRepository.saveDiagram(diagram);
        return diagram.version;
    }
    parsePayload(payload) {
        if (typeof payload !== 'object' ||
            payload === null ||
            Array.isArray(payload)) {
            throw new common_1.BadRequestException('El payload no es válido');
        }
        return payload;
    }
    assertProjectId(projectId) {
        if (typeof projectId !== 'string' || !uml_operation_types_1.UUID_PATTERN.test(projectId)) {
            throw new common_1.BadRequestException('Identificador de proyecto inválido');
        }
        return projectId;
    }
    assertUuid(value, label) {
        if (typeof value !== 'string' || !uml_operation_types_1.UUID_PATTERN.test(value)) {
            throw new common_1.BadRequestException(`${label} inválido`);
        }
        return value;
    }
    assertName(value, label) {
        if (typeof value !== 'string' ||
            value.trim().length === 0 ||
            value.trim().length > 120) {
            throw new common_1.BadRequestException(`${label} inválido`);
        }
        return value.trim();
    }
    assertNumber(value, label) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new common_1.BadRequestException(`${label} inválido`);
        }
        return value;
    }
    assertAttribute(value) {
        if (typeof value !== 'object' || value === null) {
            throw new common_1.BadRequestException('Atributo inválido');
        }
        const record = value;
        const { visibility, name, type } = record;
        if (!VISIBILITIES.includes(visibility)) {
            throw new common_1.BadRequestException('Visibilidad de atributo inválida');
        }
        this.assertName(name, 'Nombre de atributo');
        this.assertName(type, 'Tipo de atributo');
        const keyType = record.keyType;
        if (keyType !== undefined &&
            !['NONE', 'PK', 'FK'].includes(keyType)) {
            throw new common_1.BadRequestException('Tipo de clave inválido');
        }
        if (record.nullable !== undefined && typeof record.nullable !== 'boolean') {
            throw new common_1.BadRequestException('Nulabilidad inválida');
        }
    }
    async validateErAttributes(diagramId, attributes) {
        for (const attribute of attributes) {
            if (!ER_DATA_TYPES.has(attribute.type.trim().toUpperCase())) {
                throw new common_1.BadRequestException(`Tipo de dato ER no soportado: ${attribute.type}`);
            }
        }
        const primaryKeys = attributes.filter((attribute) => attribute.keyType === 'PK');
        if (primaryKeys.length > 1 &&
            primaryKeys.some((attribute) => !attribute.isCompositeKey)) {
            throw new common_1.BadRequestException('Varias PK deben marcarse explícitamente como clave compuesta');
        }
        for (const attribute of attributes) {
            if (attribute.keyType !== 'FK')
                continue;
            if (!attribute.referencesEntityId || !attribute.referencesAttributeId) {
                throw new common_1.BadRequestException('La FK debe referenciar una entidad y atributo');
            }
            const target = await this.diagramRepository.findClassById(attribute.referencesEntityId);
            if (!target || target.diagramId !== diagramId) {
                throw new common_1.BadRequestException('La entidad referenciada no existe');
            }
            const targetAttribute = target.attributes.find((item) => item.id === attribute.referencesAttributeId);
            if (!targetAttribute) {
                throw new common_1.BadRequestException('La FK referencia una columna inexistente');
            }
            if (!this.areTypesCompatible(attribute.type, targetAttribute.type)) {
                throw new common_1.BadRequestException('El tipo de la FK no es compatible con la columna referenciada');
            }
        }
    }
    assertMethod(value) {
        if (typeof value !== 'object' || value === null) {
            throw new common_1.BadRequestException('Método inválido');
        }
        const { visibility, name, parameters, returnType } = value;
        if (!VISIBILITIES.includes(visibility)) {
            throw new common_1.BadRequestException('Visibilidad de método inválida');
        }
        this.assertName(name, 'Nombre de método');
        if (typeof parameters !== 'string' || parameters.length > 255) {
            throw new common_1.BadRequestException('Parámetros de método inválidos');
        }
        if (typeof returnType !== 'string' || returnType.trim().length > 120) {
            throw new common_1.BadRequestException('Tipo de retorno de método inválido');
        }
    }
    parseNodeInput(node) {
        if (typeof node !== 'object' || node === null) {
            throw new common_1.BadRequestException('Nodo inválido');
        }
        const { id, name, x, y, attributes, methods } = node;
        const nodeId = this.assertUuid(id, 'Nodo');
        const nodeName = this.assertName(name, 'Nombre de nodo');
        const positionX = this.assertNumber(x, 'Posición X');
        const positionY = this.assertNumber(y, 'Posición Y');
        return {
            id: nodeId,
            name: nodeName,
            x: positionX,
            y: positionY,
            attributes: this.parseAttributes(attributes),
            methods: this.parseMethods(methods),
            tableName: typeof node.tableName === 'string'
                ? node.tableName.trim()
                : undefined,
            description: typeof node.description === 'string'
                ? node.description.trim()
                : null,
        };
    }
    parseNodePatch(patch) {
        if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
            throw new common_1.BadRequestException('El parche del nodo no es válido');
        }
        const { name, x, y, attributes, methods, tableName, description } = patch;
        const result = {};
        if (name !== undefined) {
            result.name = this.assertName(name, 'Nombre de nodo');
        }
        if (x !== undefined) {
            result.x = this.assertNumber(x, 'Posición X');
        }
        if (y !== undefined) {
            result.y = this.assertNumber(y, 'Posición Y');
        }
        if (attributes !== undefined) {
            result.attributes = this.parseAttributes(attributes);
        }
        if (methods !== undefined) {
            result.methods = this.parseMethods(methods);
        }
        if (tableName !== undefined) {
            result.tableName = this.assertName(tableName, 'Nombre de tabla');
        }
        if (description !== undefined) {
            if (description !== null && typeof description !== 'string') {
                throw new common_1.BadRequestException('Descripción inválida');
            }
            result.description = description === null ? null : description.trim();
        }
        return result;
    }
    parseAttributes(value) {
        if (value === undefined) {
            return [];
        }
        if (!Array.isArray(value)) {
            throw new common_1.BadRequestException('Atributos inválidos');
        }
        value.forEach((item) => this.assertAttribute(item));
        return value.map((item) => {
            const attribute = item;
            return {
                ...attribute,
                id: attribute.id ?? crypto.randomUUID(),
                nullable: attribute.nullable ?? true,
                keyType: attribute.keyType ?? 'NONE',
                referencesEntityId: attribute.referencesEntityId ?? null,
                referencesAttributeId: attribute.referencesAttributeId ?? null,
            };
        });
    }
    parseMethods(value) {
        if (value === undefined) {
            return [];
        }
        if (!Array.isArray(value)) {
            throw new common_1.BadRequestException('Métodos inválidos');
        }
        value.forEach((item) => this.assertMethod(item));
        return value;
    }
    parseEdgeInput(edge) {
        if (typeof edge !== 'object' || edge === null) {
            throw new common_1.BadRequestException('Relación inválida');
        }
        const { id, sourceId, targetId, type, sourceMin, sourceMax, targetMin, targetMax, sourceRole, targetRole, } = edge;
        const relationType = type;
        this.assertRelationType(type);
        return {
            id: this.assertUuid(id, 'Relación'),
            sourceId: this.assertUuid(sourceId, 'Nodo origen'),
            targetId: this.assertUuid(targetId, 'Nodo destino'),
            type: relationType,
            ...this.parseEndMultiplicity(sourceMin, sourceMax, 'Origen'),
            ...this.parseEndMultiplicity(targetMin, targetMax, 'Destino'),
            sourceRole: this.parseRole(sourceRole),
            targetRole: this.parseRole(targetRole),
        };
    }
    assertRelationType(value) {
        if (!VALID_RELATION_TYPES.includes(value)) {
            throw new common_1.BadRequestException('Tipo de relación inválido');
        }
        return value;
    }
    parseRelationPatch(patch) {
        if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
            throw new common_1.BadRequestException('El parche de la relación no es válido');
        }
        const { type, sourceMin, sourceMax, targetMin, targetMax, sourceRole, targetRole, } = patch;
        const result = {};
        if (type !== undefined) {
            result.type = this.assertRelationType(type);
        }
        const source = this.parseEndMultiplicity(sourceMin, sourceMax, 'Origen');
        if (source) {
            if ('sourceMin' in source) {
                result.sourceMin = source.sourceMin;
                result.sourceMax = source.sourceMax;
            }
        }
        const target = this.parseEndMultiplicity(targetMin, targetMax, 'Destino');
        if (target) {
            if ('targetMin' in target) {
                result.targetMin = target.targetMin;
                result.targetMax = target.targetMax;
            }
        }
        if (sourceRole !== undefined) {
            result.sourceRole = this.parseRole(sourceRole);
        }
        if (targetRole !== undefined) {
            result.targetRole = this.parseRole(targetRole);
        }
        return result;
    }
    parseEndMultiplicity(minValue, maxValue, label) {
        if (minValue === undefined && maxValue === undefined) {
            return null;
        }
        const min = this.assertNonNegativeInt(minValue ?? 1, `${label} mínimo`);
        const max = maxValue === null || maxValue === undefined
            ? null
            : this.assertNonNegativeInt(maxValue, `${label} máximo`);
        if (max !== null && max < min) {
            throw new common_1.BadRequestException(`${label}: el máximo no puede ser menor que el mínimo`);
        }
        if (label === 'Origen') {
            return { sourceMin: min, sourceMax: max };
        }
        return { targetMin: min, targetMax: max };
    }
    assertNonNegativeInt(value, label) {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
            throw new common_1.BadRequestException(`${label} inválido`);
        }
        return value;
    }
    parseRole(value) {
        if (value === undefined || value === null) {
            return null;
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('Rol de relación inválido');
        }
        const role = value.trim();
        if (role.length > 64) {
            throw new common_1.BadRequestException('Rol de relación inválido');
        }
        return role.length > 0 ? role : null;
    }
    toNodeResponse(node) {
        return {
            id: node.id,
            name: node.name,
            tableName: node.tableName ?? null,
            description: node.description ?? null,
            x: node.positionX,
            y: node.positionY,
            attributes: node.attributes.map((a) => ({
                ...a,
                id: a.id ?? crypto.randomUUID(),
            })),
            methods: node.methods,
            updatedAt: node.updatedAt.toISOString(),
        };
    }
    areTypesCompatible(sourceType, targetType) {
        const normalize = (type) => type.trim().toUpperCase().replace(/\s*\(.+\)\s*$/, '');
        const source = normalize(sourceType);
        const target = normalize(targetType);
        if (source === target)
            return true;
        const compat = {
            SMALLINT: ['INT', 'BIGINT'],
            INT: ['BIGINT'],
            FLOAT: ['DOUBLE'],
            CHAR: ['VARCHAR', 'TEXT'],
            VARCHAR: ['TEXT'],
        };
        return compat[target]?.includes(source) ?? false;
    }
    normalizeGeneratedAttributeTypes(attributes) {
        if (!Array.isArray(attributes)) {
            return attributes;
        }
        const aliases = {
            STRING: 'VARCHAR',
            INTEGER: 'INT',
            LONG: 'BIGINT',
            SHORT: 'SMALLINT',
            DOUBLE: 'DOUBLE',
            FLOAT: 'FLOAT',
            BOOL: 'BOOLEAN',
        };
        return attributes.map((attribute) => {
            if (!attribute || typeof attribute !== 'object') {
                return attribute;
            }
            const raw = attribute;
            if (typeof raw.type !== 'string') {
                return attribute;
            }
            const cleaned = raw.type
                .trim()
                .toUpperCase()
                .replace(/\s*\(.+\)\s*$/, '');
            const normalized = aliases[cleaned] ?? (cleaned === 'VARCHAR2' ? 'VARCHAR' : cleaned);
            if (normalized === raw.type) {
                return attribute;
            }
            return { ...raw, type: normalized };
        });
    }
    toEdgeResponse(edge) {
        return {
            id: edge.id,
            sourceId: edge.sourceNodeId,
            targetId: edge.targetNodeId,
            type: edge.type,
            sourceMin: edge.sourceMin,
            sourceMax: edge.sourceMax,
            targetMin: edge.targetMin,
            targetMax: edge.targetMax,
            sourceRole: edge.sourceRole,
            targetRole: edge.targetRole,
            updatedAt: edge.updatedAt.toISOString(),
        };
    }
};
exports.UmlDiagramService = UmlDiagramService;
exports.UmlDiagramService = UmlDiagramService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(project_members_repository_interface_1.PROJECT_MEMBERS_REPOSITORY)),
    __param(1, (0, common_1.Inject)(uml_diagram_repository_interface_1.UML_DIAGRAM_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], UmlDiagramService);
//# sourceMappingURL=uml-diagram.service.js.map
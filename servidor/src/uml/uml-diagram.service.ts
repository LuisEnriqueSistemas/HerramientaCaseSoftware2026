import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMemberRole } from '../projects/entities/project-member.entity';
import { PROJECT_MEMBERS_REPOSITORY } from '../projects/repositories/project-members-repository.interface';
import type { ProjectMembersRepository } from '../projects/repositories/project-members-repository.interface';
import { UmlClassNode, Visibility } from './entities/uml-class-node.entity';
import { UmlDiagram, UmlDiagramModelType } from './entities/uml-diagram.entity';
import { UmlRelation, UmlRelationType } from './entities/uml-relation.entity';
import {
  UmlDiagramResponseDto,
  UmlEdgeResponseDto,
  UmlNodeResponseDto,
} from './dto/uml-diagram-response.dto';
import {
  AddUmlNodePayload,
  AddUmlRelationPayload,
  UmlNodeInput,
  UmlNodePatch,
  UmlRelationInput,
  UmlRelationPatch,
  UpdateUmlRelationPayload,
  UUID_PATTERN,
} from './interfaces/uml-operation.types';
import { UML_DIAGRAM_REPOSITORY } from './repositories/uml-diagram-repository.interface';
import type { UmlDiagramRepository } from './repositories/uml-diagram-repository.interface';
import type { GeneratedDiagram } from '../ai/interfaces/ai.types';

const VISIBILITIES: readonly Visibility[] = ['public', 'private', 'protected'];

const VALID_RELATION_TYPES: readonly UmlRelationType[] = [
  UmlRelationType.ASSOCIATION,
  UmlRelationType.INHERITANCE,
  UmlRelationType.REALIZATION,
  UmlRelationType.AGGREGATION,
  UmlRelationType.COMPOSITION,
  UmlRelationType.DEPENDENCY,
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

export interface UmlNodeChangedResult {
  projectId: string;
  node: UmlNodeResponseDto;
  version: number;
}

export interface UmlNodeDeletedResult {
  projectId: string;
  nodeId: string;
  deletedRelationIds: string[];
  version: number;
}

export interface UmlRelationChangedResult {
  projectId: string;
  edge: UmlEdgeResponseDto;
  version: number;
}

export interface UmlRelationDeletedResult {
  projectId: string;
  edgeId: string;
  version: number;
}

export interface UmlDiagramTypeChangedResult {
  projectId: string;
  modelType: UmlDiagramModelType;
  version: number;
}

@Injectable()
export class UmlDiagramService {
  constructor(
    @Inject(PROJECT_MEMBERS_REPOSITORY)
    private readonly membersRepository: ProjectMembersRepository,
    @Inject(UML_DIAGRAM_REPOSITORY)
    private readonly diagramRepository: UmlDiagramRepository,
  ) {}

  async getDiagram(
    userId: string,
    projectId: string,
  ): Promise<UmlDiagramResponseDto> {
    this.assertProjectId(projectId);
    const membership = await this.getMembershipOrThrow(userId, projectId);
    const diagram =
      await this.diagramRepository.findOrCreateForProject(projectId);
    const [classes, relations] = await Promise.all([
      this.diagramRepository.listClasses(diagram.id),
      this.diagramRepository.listRelations(diagram.id),
    ]);
    return {
      diagramId: diagram.id,
      projectId,
      version: diagram.version,
      modelType: UmlDiagramModelType.ER_LOGICAL,
      canEdit: membership.role !== ProjectMemberRole.VIEWER,
      nodes: classes.map((node) => this.toNodeResponse(node)),
      edges: relations.map((edge) => this.toEdgeResponse(edge)),
    };
  }

  async applyDiagramType(
    userId: string,
    payload: unknown,
  ): Promise<UmlDiagramTypeChangedResult> {
    const parsed = this.parsePayload<{
      projectId: string;
      modelType: UmlDiagramModelType;
    }>(payload);
    this.assertProjectId(parsed.projectId);
    await this.requireEditor(userId, parsed.projectId);
    if (parsed.modelType !== UmlDiagramModelType.ER_LOGICAL) {
      throw new BadRequestException(
        'El diagramador solo admite el modelo ER lógico',
      );
    }
    const diagram = await this.diagramRepository.findOrCreateForProject(
      parsed.projectId,
    );
    diagram.modelType = UmlDiagramModelType.ER_LOGICAL;
    const saved = await this.bumpVersion(diagram);
    return {
      projectId: parsed.projectId,
      modelType: UmlDiagramModelType.ER_LOGICAL,
      version: saved,
    };
  }

  async applyGeneratedDiagram(
    userId: string,
    projectId: string,
    structure: GeneratedDiagram,
  ): Promise<UmlDiagramResponseDto> {
    this.assertProjectId(projectId);
    await this.requireEditor(userId, projectId);
    if (!Array.isArray(structure.classes) || structure.classes.length === 0) {
      throw new BadRequestException('La IA no generó clases para el diagrama');
    }
    if (!Array.isArray(structure.relations)) {
      throw new BadRequestException('Las relaciones generadas no son válidas');
    }

    const diagram =
      await this.diagramRepository.findOrCreateForProject(projectId);
    const existingClasses = await this.diagramRepository.listClasses(
      diagram.id,
    );
    const classByName = new Map(
      existingClasses.map((node) => [node.name.toLowerCase(), node]),
    );

    for (const [index, generated] of structure.classes.entries()) {
      if (!generated || typeof generated !== 'object') {
        throw new BadRequestException('Clase generada inválida');
      }
      const name = this.assertName(generated?.name, 'Nombre de clase');
      const existing = classByName.get(name.toLowerCase());
      const normalizedAttributes = this.normalizeGeneratedAttributeTypes(
        generated.attributes,
      );
      const node = {
        ...(existing ?? {}),
        id: existing?.id ?? crypto.randomUUID(),
        diagramId: diagram.id,
        name,
        positionX: this.assertNumber(
          generated.x ?? 120 + (index % 3) * 260,
          'Posición X',
        ),
        positionY: this.assertNumber(
          generated.y ?? 120 + Math.floor(index / 3) * 220,
          'Posición Y',
        ),
        attributes: this.parseAttributes(normalizedAttributes),
        methods: this.parseMethods(generated.methods),
      } as UmlClassNode;
      const saved = await this.diagramRepository.saveClass(node);
      classByName.set(name.toLowerCase(), saved);
    }

    const existingRelations = await this.diagramRepository.listRelations(
      diagram.id,
    );
    for (const generated of structure.relations) {
      if (
        !generated ||
        typeof generated.source !== 'string' ||
        typeof generated.target !== 'string'
      ) {
        throw new BadRequestException('Relación generada inválida');
      }
      const source = classByName.get(generated.source.trim().toLowerCase());
      const target = classByName.get(generated.target.trim().toLowerCase());
      if (!source || !target) {
        throw new BadRequestException(
          'La relación referencia una clase inexistente',
        );
      }
      this.assertRelationType(generated.type);
      const duplicate = existingRelations.some(
        (relation) =>
          relation.sourceNodeId === source.id &&
          relation.targetNodeId === target.id &&
          relation.type === generated.type,
      );
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
      } as UmlRelation);
      existingRelations.push(saved);
    }

    await this.bumpVersion(diagram);
    return this.getDiagram(userId, projectId);
  }

  async applyNodeAdded(
    userId: string,
    payload: unknown,
  ): Promise<UmlNodeChangedResult> {
    const { projectId, node } = this.parsePayload<AddUmlNodePayload>(payload);
    await this.requireEditor(userId, projectId);
    const input = this.parseNodeInput(node);
    const diagram =
      await this.diagramRepository.findOrCreateForProject(projectId);
    await this.validateErAttributes(diagram.id, input.attributes ?? []);
    const existing = await this.diagramRepository.findClassById(input.id);
    if (existing) {
      throw new BadRequestException('El nodo ya existe en el diagrama');
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
    } as UmlClassNode);
    const version = await this.bumpVersion(diagram);
    return { projectId, node: this.toNodeResponse(saved), version };
  }

  async applyNodeUpdated(
    userId: string,
    payload: unknown,
  ): Promise<UmlNodeChangedResult> {
    const parsed = this.parsePayload<{
      projectId: string;
      nodeId: string;
      patch: UmlNodePatch;
    }>(payload);
    await this.requireEditor(userId, parsed.projectId);
    const nodeId = this.assertUuid(parsed.nodeId, 'Nodo');
    const patch = this.parseNodePatch(parsed.patch);
    const diagram = await this.diagramRepository.findOrCreateForProject(
      parsed.projectId,
    );
    const existing = await this.findNodeInDiagram(diagram.id, nodeId);
    if (patch.attributes !== undefined) {
      await this.validateErAttributes(diagram.id, patch.attributes);
    }
    const merged: UmlClassNode = {
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

  async applyNodeDeleted(
    userId: string,
    payload: unknown,
  ): Promise<UmlNodeDeletedResult> {
    const parsed = this.parsePayload<{
      projectId: string;
      nodeId: string;
    }>(payload);
    await this.requireEditor(userId, parsed.projectId);
    const nodeId = this.assertUuid(parsed.nodeId, 'Nodo');
    const diagram = await this.diagramRepository.findOrCreateForProject(
      parsed.projectId,
    );
    await this.findNodeInDiagram(diagram.id, nodeId);
    const deletedRelations =
      await this.diagramRepository.deleteRelationsFromNode(diagram.id, nodeId);
    await this.diagramRepository.deleteNode(diagram.id, nodeId);
    const version = await this.bumpVersion(diagram);
    return {
      projectId: parsed.projectId,
      nodeId,
      deletedRelationIds: deletedRelations.map((relation) => relation.id),
      version,
    };
  }

  async applyRelationAdded(
    userId: string,
    payload: unknown,
  ): Promise<UmlRelationChangedResult> {
    const { projectId, edge } =
      this.parsePayload<AddUmlRelationPayload>(payload);
    await this.requireEditor(userId, projectId);
    const input = this.parseEdgeInput(edge);
    const diagram =
      await this.diagramRepository.findOrCreateForProject(projectId);
    const source = await this.findNodeInDiagram(diagram.id, input.sourceId);
    await this.findNodeInDiagram(diagram.id, input.targetId);
    const existing = await this.diagramRepository.findRelationById(input.id);
    if (existing) {
      throw new BadRequestException('La relación ya existe en el diagrama');
    }
    void source;
    const sourceMin = input.sourceMin ?? 1;
    const sourceMax =
      input.sourceMax === undefined ? sourceMin : input.sourceMax;
    const targetMin = input.targetMin ?? 1;
    const targetMax =
      input.targetMax === undefined ? targetMin : input.targetMax;
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
    } as UmlRelation);
    const version = await this.bumpVersion(diagram);
    return { projectId, edge: this.toEdgeResponse(saved), version };
  }

  async applyRelationUpdated(
    userId: string,
    payload: unknown,
  ): Promise<UmlRelationChangedResult> {
    const parsed = this.parsePayload<UpdateUmlRelationPayload>(payload);
    await this.requireEditor(userId, parsed.projectId);
    const edgeId = this.assertUuid(parsed.edgeId, 'Relación');
    const patch = this.parseRelationPatch(parsed.patch);
    const diagram = await this.diagramRepository.findOrCreateForProject(
      parsed.projectId,
    );
    const existing = await this.diagramRepository.findRelationById(edgeId);
    if (!existing || existing.diagramId !== diagram.id) {
      throw new NotFoundException('Relación no encontrada');
    }
    const merged: UmlRelation = {
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

  async applyRelationDeleted(
    userId: string,
    payload: unknown,
  ): Promise<UmlRelationDeletedResult> {
    const parsed = this.parsePayload<{
      projectId: string;
      edgeId: string;
    }>(payload);
    await this.requireEditor(userId, parsed.projectId);
    const edgeId = this.assertUuid(parsed.edgeId, 'Relación');
    const diagram = await this.diagramRepository.findOrCreateForProject(
      parsed.projectId,
    );
    const existing = await this.diagramRepository.findRelationById(edgeId);
    if (!existing || existing.diagramId !== diagram.id) {
      throw new NotFoundException('Relación no encontrada');
    }
    await this.diagramRepository.deleteRelation(diagram.id, edgeId);
    const version = await this.bumpVersion(diagram);
    return { projectId: parsed.projectId, edgeId, version };
  }

  private async getMembershipOrThrow(userId: string, projectId: string) {
    const membership = await this.membersRepository.find(projectId, userId);
    if (!membership) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return membership;
  }

  private async requireEditor(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const membership = await this.getMembershipOrThrow(userId, projectId);
    if (membership.role === ProjectMemberRole.VIEWER) {
      throw new ForbiddenException(
        'No tienes permisos de edición en este diagrama',
      );
    }
  }

  private async findNodeInDiagram(
    diagramId: string,
    nodeId: string,
  ): Promise<UmlClassNode> {
    const node = await this.diagramRepository.findClassById(nodeId);
    if (!node || node.diagramId !== diagramId) {
      throw new NotFoundException('Nodo no encontrado');
    }
    return node;
  }

  private async bumpVersion(diagram: UmlDiagram): Promise<number> {
    diagram.version += 1;
    await this.diagramRepository.saveDiagram(diagram);
    return diagram.version;
  }

  private parsePayload<T>(payload: unknown): T {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      throw new BadRequestException('El payload no es válido');
    }
    return payload as T;
  }

  private assertProjectId(projectId: unknown): string {
    if (typeof projectId !== 'string' || !UUID_PATTERN.test(projectId)) {
      throw new BadRequestException('Identificador de proyecto inválido');
    }
    return projectId;
  }

  private assertUuid(value: unknown, label: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      throw new BadRequestException(`${label} inválido`);
    }
    return value;
  }

  private assertName(value: unknown, label: string): string {
    if (
      typeof value !== 'string' ||
      value.trim().length === 0 ||
      value.trim().length > 120
    ) {
      throw new BadRequestException(`${label} inválido`);
    }
    return value.trim();
  }

  private assertNumber(value: unknown, label: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BadRequestException(`${label} inválido`);
    }
    return value;
  }

  private assertAttribute(value: unknown): void {
    if (typeof value !== 'object' || value === null) {
      throw new BadRequestException('Atributo inválido');
    }
    const record = value as Record<string, unknown>;
    const { visibility, name, type } = record;
    if (!VISIBILITIES.includes(visibility as Visibility)) {
      throw new BadRequestException('Visibilidad de atributo inválida');
    }
    this.assertName(name, 'Nombre de atributo');
    this.assertName(type, 'Tipo de atributo');
    const keyType = record.keyType;
    if (
      keyType !== undefined &&
      !['NONE', 'PK', 'FK'].includes(keyType as string)
    ) {
      throw new BadRequestException('Tipo de clave inválido');
    }
    if (record.nullable !== undefined && typeof record.nullable !== 'boolean') {
      throw new BadRequestException('Nulabilidad inválida');
    }
  }

  private async validateErAttributes(
    diagramId: string,
    attributes: UmlClassNode['attributes'],
  ): Promise<void> {
    for (const attribute of attributes) {
      if (!ER_DATA_TYPES.has(attribute.type.trim().toUpperCase())) {
        throw new BadRequestException(
          `Tipo de dato ER no soportado: ${attribute.type}`,
        );
      }
    }
    const primaryKeys = attributes.filter(
      (attribute) => attribute.keyType === 'PK',
    );
    if (
      primaryKeys.length > 1 &&
      primaryKeys.some((attribute) => !attribute.isCompositeKey)
    ) {
      throw new BadRequestException(
        'Varias PK deben marcarse explícitamente como clave compuesta',
      );
    }
    for (const attribute of attributes) {
      if (attribute.keyType !== 'FK') continue;
      if (!attribute.referencesEntityId || !attribute.referencesAttributeId) {
        throw new BadRequestException(
          'La FK debe referenciar una entidad y atributo',
        );
      }
      const target = await this.diagramRepository.findClassById(
        attribute.referencesEntityId,
      );
      if (!target || target.diagramId !== diagramId) {
        throw new BadRequestException('La entidad referenciada no existe');
      }
      const targetAttribute = target.attributes.find(
        (item) => item.id === attribute.referencesAttributeId,
      );
      if (!targetAttribute) {
        throw new BadRequestException('La FK referencia una columna inexistente');
      }
      if (!this.areTypesCompatible(attribute.type, targetAttribute.type)) {
        throw new BadRequestException(
          'El tipo de la FK no es compatible con la columna referenciada',
        );
      }
    }
  }

  private assertMethod(value: unknown): void {
    if (typeof value !== 'object' || value === null) {
      throw new BadRequestException('Método inválido');
    }
    const { visibility, name, parameters, returnType } = value as Record<
      string,
      unknown
    >;
    if (!VISIBILITIES.includes(visibility as Visibility)) {
      throw new BadRequestException('Visibilidad de método inválida');
    }
    this.assertName(name, 'Nombre de método');
    if (typeof parameters !== 'string' || parameters.length > 255) {
      throw new BadRequestException('Parámetros de método inválidos');
    }
    if (typeof returnType !== 'string' || returnType.trim().length > 120) {
      throw new BadRequestException('Tipo de retorno de método inválido');
    }
  }

  private parseNodeInput(node: unknown): UmlNodeInput {
    if (typeof node !== 'object' || node === null) {
      throw new BadRequestException('Nodo inválido');
    }
    const { id, name, x, y, attributes, methods } = node as Record<
      string,
      unknown
    >;
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
      tableName:
        typeof (node as Record<string, unknown>).tableName === 'string'
          ? ((node as Record<string, unknown>).tableName as string).trim()
          : undefined,
      description:
        typeof (node as Record<string, unknown>).description === 'string'
          ? ((node as Record<string, unknown>).description as string).trim()
          : null,
    };
  }

  private parseNodePatch(patch: unknown): UmlNodePatch {
    if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
      throw new BadRequestException('El parche del nodo no es válido');
    }
    const { name, x, y, attributes, methods, tableName, description } =
      patch as Record<string, unknown>;
    const result: UmlNodePatch = {};
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
        throw new BadRequestException('Descripción inválida');
      }
      result.description = description === null ? null : description.trim();
    }
    return result;
  }

  private parseAttributes(value: unknown) {
    if (value === undefined) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new BadRequestException('Atributos inválidos');
    }
    value.forEach((item) => this.assertAttribute(item));
    return value.map((item) => {
      const attribute = item as UmlClassNode['attributes'][number];
      return {
        ...attribute,
        id: attribute.id ?? crypto.randomUUID(),
        nullable: attribute.nullable ?? true,
        keyType: attribute.keyType ?? 'NONE',
        referencesEntityId: attribute.referencesEntityId ?? null,
        referencesAttributeId: attribute.referencesAttributeId ?? null,
      };
    }) as UmlClassNode['attributes'];
  }

  private parseMethods(value: unknown) {
    if (value === undefined) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new BadRequestException('Métodos inválidos');
    }
    value.forEach((item) => this.assertMethod(item));
    return value as UmlClassNode['methods'];
  }

  private parseEdgeInput(edge: unknown): UmlRelationInput {
    if (typeof edge !== 'object' || edge === null) {
      throw new BadRequestException('Relación inválida');
    }
    const {
      id,
      sourceId,
      targetId,
      type,
      sourceMin,
      sourceMax,
      targetMin,
      targetMax,
      sourceRole,
      targetRole,
    } = edge as Record<string, unknown>;
    const relationType = type as UmlRelationType;
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

  private assertRelationType(value: unknown): UmlRelationType {
    if (!VALID_RELATION_TYPES.includes(value as UmlRelationType)) {
      throw new BadRequestException('Tipo de relación inválido');
    }
    return value as UmlRelationType;
  }

  private parseRelationPatch(patch: unknown): UmlRelationPatch {
    if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
      throw new BadRequestException('El parche de la relación no es válido');
    }
    const {
      type,
      sourceMin,
      sourceMax,
      targetMin,
      targetMax,
      sourceRole,
      targetRole,
    } = patch as Record<string, unknown>;
    const result: UmlRelationPatch = {};
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

  private parseEndMultiplicity(
    minValue: unknown,
    maxValue: unknown,
    label: 'Origen' | 'Destino',
  ):
    | { sourceMin: number; sourceMax: number | null }
    | { targetMin: number; targetMax: number | null }
    | null {
    if (minValue === undefined && maxValue === undefined) {
      return null;
    }
    const min = this.assertNonNegativeInt(minValue ?? 1, `${label} mínimo`);
    const max =
      maxValue === null || maxValue === undefined
        ? null
        : this.assertNonNegativeInt(maxValue, `${label} máximo`);
    if (max !== null && max < min) {
      throw new BadRequestException(
        `${label}: el máximo no puede ser menor que el mínimo`,
      );
    }
    if (label === 'Origen') {
      return { sourceMin: min, sourceMax: max };
    }
    return { targetMin: min, targetMax: max };
  }

  private assertNonNegativeInt(value: unknown, label: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new BadRequestException(`${label} inválido`);
    }
    return value;
  }

  private parseRole(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value !== 'string') {
      throw new BadRequestException('Rol de relación inválido');
    }
    const role = value.trim();
    if (role.length > 64) {
      throw new BadRequestException('Rol de relación inválido');
    }
    return role.length > 0 ? role : null;
  }

  private toNodeResponse(node: UmlClassNode): UmlNodeResponseDto {
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

  private areTypesCompatible(sourceType: string, targetType: string): boolean {
    const normalize = (type: string) =>
      type.trim().toUpperCase().replace(/\s*\(.+\)\s*$/, '');
    const source = normalize(sourceType);
    const target = normalize(targetType);
    if (source === target) return true;
    const compat: Record<string, string[]> = {
      SMALLINT: ['INT', 'BIGINT'],
      INT: ['BIGINT'],
      FLOAT: ['DOUBLE'],
      CHAR: ['VARCHAR', 'TEXT'],
      VARCHAR: ['TEXT'],
    };
    return compat[target]?.includes(source) ?? false;
  }

  private normalizeGeneratedAttributeTypes(attributes: unknown): unknown {
    if (!Array.isArray(attributes)) {
      return attributes;
    }
    const aliases: Record<string, string> = {
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
      const raw = attribute as Record<string, unknown>;
      if (typeof raw.type !== 'string') {
        return attribute;
      }
      const cleaned = raw.type
        .trim()
        .toUpperCase()
        .replace(/\s*\(.+\)\s*$/, '');
      const normalized =
        aliases[cleaned] ?? (cleaned === 'VARCHAR2' ? 'VARCHAR' : cleaned);
      if (normalized === raw.type) {
        return attribute;
      }
      return { ...raw, type: normalized };
    });
  }

  private toEdgeResponse(edge: UmlRelation): UmlEdgeResponseDto {
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
}

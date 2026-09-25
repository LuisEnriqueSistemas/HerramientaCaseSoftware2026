import { Injectable } from '@nestjs/common';
import type {
  UmlDiagramResponseDto,
  UmlEdgeResponseDto,
  UmlNodeResponseDto,
} from '../dto/uml-diagram-response.dto';
import { UmlRelationType } from '../entities/uml-relation.entity';

const UML_PRIMITIVE_TYPES: Record<string, string> = {
  string: 'String',
  text: 'String',
  uuid: 'String',
  int: 'Integer',
  integer: 'Integer',
  bigint: 'Integer',
  float: 'Real',
  double: 'Real',
  decimal: 'Real',
  boolean: 'Boolean',
  bool: 'Boolean',
  date: 'String',
  datetime: 'String',
};

const UML_PRIMITIVE_HREF: Record<string, string> = {
  Boolean: 'Boolean',
  Integer: 'Integer',
  Real: 'Real',
  String: 'String',
};

export function xmiNameFor(raw: string, fallback = 'Elemento'): string {
  const name = raw.trim().replace(/[^A-Za-z0-9_.-]/g, '_');
  return name.length > 0 ? name : fallback;
}

@Injectable()
export class UmlXmiExportService {
  buildXmi(diagram: UmlDiagramResponseDto): string {
    const classNames = new Map<string, string>();
    const classIds = new Map<string, string>();
    const usedNames = new Set<string>();

    for (const node of diagram.nodes) {
      let name = xmiNameFor(node.name, 'Clase');
      let suffix = 2;
      while (usedNames.has(name)) {
        name = `${xmiNameFor(node.name, 'Clase')}${suffix}`;
        suffix += 1;
      }
      usedNames.add(name);
      classNames.set(node.id, name);
      classIds.set(node.id, `class_${node.id}`);
    }

    const inheritanceByTarget = new Map<string, UmlEdgeResponseDto[]>();
    for (const edge of diagram.edges) {
      if (edge.type === UmlRelationType.INHERITANCE) {
        const current = inheritanceByTarget.get(edge.sourceId) ?? [];
        current.push(edge);
        inheritanceByTarget.set(edge.sourceId, current);
      }
    }

    const classes = diagram.nodes.map((node) =>
      this.buildClass(node, classNames, classIds, inheritanceByTarget),
    );
    const relations = diagram.edges
      .filter((edge) => edge.type !== UmlRelationType.INHERITANCE)
      .map((edge) => this.buildRelation(edge, classNames, classIds));

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<xmi:XMI xmi:version="2.5" xmlns:xmi="http://www.omg.org/XMI" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML">',
      `\t<uml:Model xmi:id="model_${this.escape(diagram.diagramId)}" name="${this.escape(`Modelo ${diagram.projectId}`)}">`,
      ...classes,
      ...relations,
      '\t</uml:Model>',
      '</xmi:XMI>',
    ].join('\n');
  }

  private buildClass(
    node: UmlNodeResponseDto,
    classNames: Map<string, string>,
    classIds: Map<string, string>,
    inheritanceByTarget: Map<string, UmlEdgeResponseDto[]>,
  ): string {
    const classId = classIds.get(node.id) as string;
    const attributes = node.attributes.map((attribute, index) => {
      const primitive = this.primitiveType(attribute.type);
      return [
        `\t\t<ownedAttribute xmi:type="uml:Property" xmi:id="${classId}_attribute_${index}" name="${this.escape(attribute.name)}" visibility="${attribute.visibility}">`,
        `\t\t\t<type xmi:type="uml:PrimitiveType" href="http://www.omg.org/spec/UML/20131001/PrimitiveTypes.xmi#${primitive}"/>`,
        '\t\t</ownedAttribute>',
      ].join('\n');
    });
    const operations = node.methods.map((method, index) => {
      const parameters = method.parameters
        .split(',')
        .map((parameter) => parameter.trim())
        .filter(Boolean)
        .map((parameter, parameterIndex) => {
          const [name, type] = parameter.split(':').map((part) => part.trim());
          const primitive = this.primitiveType(type ?? 'string');
          return `\t\t\t<ownedParameter xmi:type="uml:Parameter" xmi:id="${classId}_operation_${index}_parameter_${parameterIndex}" name="${this.escape(name)}"><type xmi:type="uml:PrimitiveType" href="http://www.omg.org/spec/UML/20131001/PrimitiveTypes.xmi#${primitive}"/></ownedParameter>`;
        });
      const returnType = this.primitiveType(method.returnType);
      return [
        `\t\t<ownedOperation xmi:type="uml:Operation" xmi:id="${classId}_operation_${index}" name="${this.escape(method.name)}" visibility="${method.visibility}">`,
        ...parameters,
        `\t\t\t<ownedParameter xmi:type="uml:Parameter" xmi:id="${classId}_operation_${index}_return" direction="return"><type xmi:type="uml:PrimitiveType" href="http://www.omg.org/spec/UML/20131001/PrimitiveTypes.xmi#${returnType}"/></ownedParameter>`,
        '\t\t</ownedOperation>',
      ].join('\n');
    });
    const generalizations = (inheritanceByTarget.get(node.id) ?? []).map(
      (edge, index) =>
        `\t\t<generalization xmi:type="uml:Generalization" xmi:id="${classId}_generalization_${index}" general="${this.escape(classIds.get(edge.targetId) ?? '')}"/>`,
    );
    return [
      `\t\t<packagedElement xmi:type="uml:Class" xmi:id="${classId}" name="${this.escape(classNames.get(node.id) ?? node.name)}">`,
      ...generalizations,
      ...attributes,
      ...operations,
      '\t\t</packagedElement>',
    ].join('\n');
  }

  private buildRelation(
    edge: UmlEdgeResponseDto,
    classNames: Map<string, string>,
    classIds: Map<string, string>,
  ): string {
    const sourceId = this.escape(classIds.get(edge.sourceId) ?? '');
    const targetId = this.escape(classIds.get(edge.targetId) ?? '');
    const relationId = `relation_${this.escape(edge.id)}`;
    if (edge.type === UmlRelationType.DEPENDENCY) {
      return `\t\t<packagedElement xmi:type="uml:Dependency" xmi:id="${relationId}" client="${sourceId}" supplier="${targetId}"/>`;
    }
    if (edge.type === UmlRelationType.REALIZATION) {
      return `\t\t<packagedElement xmi:type="uml:Abstraction" xmi:id="${relationId}" client="${sourceId}" supplier="${targetId}"/>`;
    }
    const aggregation =
      edge.type === UmlRelationType.COMPOSITION
        ? 'composite'
        : edge.type === UmlRelationType.AGGREGATION
          ? 'shared'
          : 'none';
    const associationName = `${classNames.get(edge.sourceId) ?? 'Origen'}_${classNames.get(edge.targetId) ?? 'Destino'}`;
    return [
      `\t\t<packagedElement xmi:type="uml:Association" xmi:id="${relationId}" name="${this.escape(associationName)}">`,
      `\t\t\t<ownedEnd xmi:type="uml:Property" xmi:id="${relationId}_source" type="${sourceId}" name="${this.escape(edge.sourceRole ?? '')}" aggregation="none" lower="${edge.sourceMin}" upper="${this.upper(edge.sourceMax)}"/>`,
      `\t\t\t<ownedEnd xmi:type="uml:Property" xmi:id="${relationId}_target" type="${targetId}" name="${this.escape(edge.targetRole ?? '')}" aggregation="${aggregation}" lower="${edge.targetMin}" upper="${this.upper(edge.targetMax)}"/>`,
      '\t\t</packagedElement>',
    ].join('\n');
  }

  private primitiveType(type: string): string {
    return UML_PRIMITIVE_HREF[
      UML_PRIMITIVE_TYPES[type.trim().toLowerCase()] ?? 'String'
    ];
  }

  private upper(value: number | null): string {
    return value === null ? '*' : String(value);
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

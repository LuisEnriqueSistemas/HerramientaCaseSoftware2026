import { Injectable } from '@nestjs/common';
import type {
  UmlDiagramResponseDto,
  UmlEdgeResponseDto,
  UmlNodeResponseDto,
} from '../dto/uml-diagram-response.dto';
import { UmlRelationType } from '../entities/uml-relation.entity';

const CONTAINED_RELATIONS: readonly UmlRelationType[] = [
  UmlRelationType.AGGREGATION,
  UmlRelationType.COMPOSITION,
  UmlRelationType.ASSOCIATION,
];

const XSD_TYPE_ALIASES: Record<string, string> = {
  xs: 'xs:string',
  string: 'xs:string',
  text: 'xs:string',
  varchar: 'xs:string',
  varbinary: 'xs:string',
  char: 'xs:string',
  character: 'xs:string',
  uuid: 'xs:string',
  nvarchar: 'xs:string',
  int: 'xs:integer',
  integer: 'xs:integer',
  bigint: 'xs:integer',
  smallint: 'xs:integer',
  tinyint: 'xs:integer',
  long: 'xs:integer',
  short: 'xs:integer',
  byte: 'xs:integer',
  float: 'xs:double',
  double: 'xs:double',
  real: 'xs:double',
  decimal: 'xs:decimal',
  numeric: 'xs:decimal',
  money: 'xs:decimal',
  boolean: 'xs:boolean',
  bool: 'xs:boolean',
  bit: 'xs:boolean',
  date: 'xs:date',
  datetime: 'xs:dateTime',
  timestamp: 'xs:dateTime',
  time: 'xs:time',
  interval: 'xs:duration',
};

export function xsdTypeFor(attributeType: string): string {
  const normalized = attributeType.trim().toLowerCase();
  return XSD_TYPE_ALIASES[normalized] ?? 'xs:string';
}

export function ncNameFor(raw: string, fallback = 'Clase'): string {
  let name = raw.trim().replace(/[^A-Za-z0-9_.-]/g, '_');
  if (name.length === 0) {
    name = fallback;
  }
  if (!/^[A-Za-z_]/.test(name)) {
    name = `_${name}`;
  }
  return name;
}

@Injectable()
export class UmlXsdExportService {
  buildXsd(diagram: UmlDiagramResponseDto): string {
    const nameCounters = new Map<string, number>();
    const usedNames = new Set<string>();

    const uniqueNodeName = (name: string): string => {
      let candidate = ncNameFor(name);
      if (usedNames.has(candidate)) {
        const counter = (nameCounters.get(candidate) ?? 1) + 1;
        nameCounters.set(candidate, counter);
        candidate = `${candidate}${counter}`;
      }
      usedNames.add(candidate);
      return candidate;
    };

    const uniqueNameByNode = new Map<string, string>();
    for (const node of diagram.nodes) {
      uniqueNameByNode.set(node.id, uniqueNodeName(node.name));
    }

    const lines: string[] = [];
    lines.push('<?xml version="1.0"?>');
    lines.push(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">`);
    for (const node of diagram.nodes) {
      const name = uniqueNameByNode.get(node.id) as string;
      lines.push(`\t<xs:element name="${name}" type="${name}"/>`);
      lines.push(
        this.buildComplexType(node, name, diagram.edges, uniqueNameByNode),
      );
    }
    lines.push('</xs:schema>');
    return lines.join('\n');
  }

  private buildComplexType(
    node: UmlNodeResponseDto,
    typeName: string,
    edges: UmlEdgeResponseDto[],
    nameByNodeId: Map<string, string>,
  ): string {
    const parent = this.inheritanceTarget(node.id, edges, nameByNodeId);
    const nested = this.nestedElements(node.id, edges, nameByNodeId);
    const attributeElements = node.attributes.map((attribute) => {
      const elementName = `${typeName}.${ncNameFor(attribute.name, 'atributo')}`;
      return `\t\t<xs:element name="${elementName}" type="${xsdTypeFor(attribute.type)}"/>`;
    });
    const children = [...attributeElements, ...nested];

    if (parent) {
      return [
        `\t<xs:complexType name="${typeName}">`,
        '\t\t<xs:complexContent>',
        `\t\t\t<xs:extension base="${parent}">`,
        ...(children.length > 0
          ? [
              '\t\t\t\t<xs:sequence>',
              ...children.map((line) => `\t\t\t\t${line}`),
              '\t\t\t\t</xs:sequence>',
            ]
          : []),
        '\t\t\t</xs:extension>',
        '\t\t</xs:complexContent>',
        '\t</xs:complexType>',
      ].join('\n');
    }

    if (children.length === 0) {
      return `\t<xs:complexType name="${typeName}"/>`;
    }
    return [
      `\t<xs:complexType name="${typeName}">`,
      '\t\t<xs:sequence>',
      ...children.map((line) => `\t\t${line}`),
      '\t\t</xs:sequence>',
      '\t</xs:complexType>',
    ].join('\n');
  }

  private inheritanceTarget(
    nodeId: string,
    edges: UmlEdgeResponseDto[],
    nameByNodeId: Map<string, string>,
  ): string | null {
    const inheritance = edges.find(
      (edge) =>
        edge.sourceId === nodeId && edge.type === UmlRelationType.INHERITANCE,
    );
    if (!inheritance) {
      return null;
    }
    return nameByNodeId.get(inheritance.targetId) ?? null;
  }

  private nestedElements(
    nodeId: string,
    edges: UmlEdgeResponseDto[],
    nameByNodeId: Map<string, string>,
  ): string[] {
    const contained = edges.filter(
      (edge) =>
        edge.sourceId === nodeId && CONTAINED_RELATIONS.includes(edge.type),
    );
    const lines: string[] = [];
    const usedNames = new Set<string>();
    for (const edge of contained) {
      const targetName = nameByNodeId.get(edge.targetId);
      if (!targetName) {
        continue;
      }
      const baseName = edge.targetRole
        ? ncNameFor(edge.targetRole, targetName)
        : targetName;
      let elementName = baseName;
      let index = 2;
      while (usedNames.has(elementName)) {
        elementName = `${baseName}${index}`;
        index += 1;
      }
      usedNames.add(elementName);
      const minOccurs = typeof edge.targetMin === 'number' ? edge.targetMin : 1;
      const maxOccurs =
        edge.targetMax === null
          ? 'unbounded'
          : typeof edge.targetMax === 'number'
            ? edge.targetMax
            : 1;
      lines.push(
        `\t\t<xs:element name="${this.xmlAttributeValue(elementName)}" type="${targetName}" minOccurs="${minOccurs}" maxOccurs="${maxOccurs}"/>`,
      );
    }
    return lines;
  }

  private xmlAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

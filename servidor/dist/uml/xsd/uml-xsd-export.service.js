"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UmlXsdExportService = void 0;
exports.xsdTypeFor = xsdTypeFor;
exports.ncNameFor = ncNameFor;
const common_1 = require("@nestjs/common");
const uml_relation_entity_1 = require("../entities/uml-relation.entity");
const CONTAINED_RELATIONS = [
    uml_relation_entity_1.UmlRelationType.AGGREGATION,
    uml_relation_entity_1.UmlRelationType.COMPOSITION,
    uml_relation_entity_1.UmlRelationType.ASSOCIATION,
];
const XSD_TYPE_ALIASES = {
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
function xsdTypeFor(attributeType) {
    const normalized = attributeType.trim().toLowerCase();
    return XSD_TYPE_ALIASES[normalized] ?? 'xs:string';
}
function ncNameFor(raw, fallback = 'Clase') {
    let name = raw.trim().replace(/[^A-Za-z0-9_.-]/g, '_');
    if (name.length === 0) {
        name = fallback;
    }
    if (!/^[A-Za-z_]/.test(name)) {
        name = `_${name}`;
    }
    return name;
}
let UmlXsdExportService = class UmlXsdExportService {
    buildXsd(diagram) {
        const nameCounters = new Map();
        const usedNames = new Set();
        const uniqueNodeName = (name) => {
            let candidate = ncNameFor(name);
            if (usedNames.has(candidate)) {
                const counter = (nameCounters.get(candidate) ?? 1) + 1;
                nameCounters.set(candidate, counter);
                candidate = `${candidate}${counter}`;
            }
            usedNames.add(candidate);
            return candidate;
        };
        const uniqueNameByNode = new Map();
        for (const node of diagram.nodes) {
            uniqueNameByNode.set(node.id, uniqueNodeName(node.name));
        }
        const lines = [];
        lines.push('<?xml version="1.0"?>');
        lines.push(`<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">`);
        for (const node of diagram.nodes) {
            const name = uniqueNameByNode.get(node.id);
            lines.push(`\t<xs:element name="${name}" type="${name}"/>`);
            lines.push(this.buildComplexType(node, name, diagram.edges, uniqueNameByNode));
        }
        lines.push('</xs:schema>');
        return lines.join('\n');
    }
    buildComplexType(node, typeName, edges, nameByNodeId) {
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
    inheritanceTarget(nodeId, edges, nameByNodeId) {
        const inheritance = edges.find((edge) => edge.sourceId === nodeId && edge.type === uml_relation_entity_1.UmlRelationType.INHERITANCE);
        if (!inheritance) {
            return null;
        }
        return nameByNodeId.get(inheritance.targetId) ?? null;
    }
    nestedElements(nodeId, edges, nameByNodeId) {
        const contained = edges.filter((edge) => edge.sourceId === nodeId && CONTAINED_RELATIONS.includes(edge.type));
        const lines = [];
        const usedNames = new Set();
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
            const maxOccurs = edge.targetMax === null
                ? 'unbounded'
                : typeof edge.targetMax === 'number'
                    ? edge.targetMax
                    : 1;
            lines.push(`\t\t<xs:element name="${this.xmlAttributeValue(elementName)}" type="${targetName}" minOccurs="${minOccurs}" maxOccurs="${maxOccurs}"/>`);
        }
        return lines;
    }
    xmlAttributeValue(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};
exports.UmlXsdExportService = UmlXsdExportService;
exports.UmlXsdExportService = UmlXsdExportService = __decorate([
    (0, common_1.Injectable)()
], UmlXsdExportService);
//# sourceMappingURL=uml-xsd-export.service.js.map
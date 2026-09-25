"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UmlXmiExportService = void 0;
exports.xmiNameFor = xmiNameFor;
const common_1 = require("@nestjs/common");
const uml_relation_entity_1 = require("../entities/uml-relation.entity");
const UML_PRIMITIVE_TYPES = {
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
const UML_PRIMITIVE_HREF = {
    Boolean: 'Boolean',
    Integer: 'Integer',
    Real: 'Real',
    String: 'String',
};
function xmiNameFor(raw, fallback = 'Elemento') {
    const name = raw.trim().replace(/[^A-Za-z0-9_.-]/g, '_');
    return name.length > 0 ? name : fallback;
}
let UmlXmiExportService = class UmlXmiExportService {
    buildXmi(diagram) {
        const classNames = new Map();
        const classIds = new Map();
        const usedNames = new Set();
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
        const inheritanceByTarget = new Map();
        for (const edge of diagram.edges) {
            if (edge.type === uml_relation_entity_1.UmlRelationType.INHERITANCE) {
                const current = inheritanceByTarget.get(edge.sourceId) ?? [];
                current.push(edge);
                inheritanceByTarget.set(edge.sourceId, current);
            }
        }
        const classes = diagram.nodes.map((node) => this.buildClass(node, classNames, classIds, inheritanceByTarget));
        const relations = diagram.edges
            .filter((edge) => edge.type !== uml_relation_entity_1.UmlRelationType.INHERITANCE)
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
    buildClass(node, classNames, classIds, inheritanceByTarget) {
        const classId = classIds.get(node.id);
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
        const generalizations = (inheritanceByTarget.get(node.id) ?? []).map((edge, index) => `\t\t<generalization xmi:type="uml:Generalization" xmi:id="${classId}_generalization_${index}" general="${this.escape(classIds.get(edge.targetId) ?? '')}"/>`);
        return [
            `\t\t<packagedElement xmi:type="uml:Class" xmi:id="${classId}" name="${this.escape(classNames.get(node.id) ?? node.name)}">`,
            ...generalizations,
            ...attributes,
            ...operations,
            '\t\t</packagedElement>',
        ].join('\n');
    }
    buildRelation(edge, classNames, classIds) {
        const sourceId = this.escape(classIds.get(edge.sourceId) ?? '');
        const targetId = this.escape(classIds.get(edge.targetId) ?? '');
        const relationId = `relation_${this.escape(edge.id)}`;
        if (edge.type === uml_relation_entity_1.UmlRelationType.DEPENDENCY) {
            return `\t\t<packagedElement xmi:type="uml:Dependency" xmi:id="${relationId}" client="${sourceId}" supplier="${targetId}"/>`;
        }
        if (edge.type === uml_relation_entity_1.UmlRelationType.REALIZATION) {
            return `\t\t<packagedElement xmi:type="uml:Abstraction" xmi:id="${relationId}" client="${sourceId}" supplier="${targetId}"/>`;
        }
        const aggregation = edge.type === uml_relation_entity_1.UmlRelationType.COMPOSITION
            ? 'composite'
            : edge.type === uml_relation_entity_1.UmlRelationType.AGGREGATION
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
    primitiveType(type) {
        return UML_PRIMITIVE_HREF[UML_PRIMITIVE_TYPES[type.trim().toLowerCase()] ?? 'String'];
    }
    upper(value) {
        return value === null ? '*' : String(value);
    }
    escape(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
};
exports.UmlXmiExportService = UmlXmiExportService;
exports.UmlXmiExportService = UmlXmiExportService = __decorate([
    (0, common_1.Injectable)()
], UmlXmiExportService);
//# sourceMappingURL=uml-xmi-export.service.js.map
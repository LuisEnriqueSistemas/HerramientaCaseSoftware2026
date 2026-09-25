import { Injectable } from '@nestjs/common';
import type {
  UmlDiagramResponseDto,
  UmlEdgeResponseDto,
  UmlNodeResponseDto,
} from '../dto/uml-diagram-response.dto';
import { UmlRelationType } from '../entities/uml-relation.entity';

@Injectable()
export class EaXmiExportService {
  buildXmi(diagram: UmlDiagramResponseDto): string {
    const classIds = new Map(
      diagram.nodes.map((node) => [node.id, `class_${node.id}`]),
    );
    const classElements = diagram.nodes.map((node) =>
      this.buildClass(node, classIds),
    );
    const relationshipElements = diagram.edges.map((edge) =>
      this.buildRelationship(edge, classIds),
    );
    const visualElements = diagram.nodes.map((node) =>
      this.buildVisualElement(node, classIds),
    );
    const visualConnectors = diagram.edges.map((edge) =>
      this.buildVisualConnector(edge, classIds),
    );

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3" xmlns:EA="http://www.sparxsystems.com/profiles/EA/1.0" xmlns:xmi="http://www.omg.org/XMI">',
      '  <XMI.header>',
      '    <XMI.documentation>',
      '      <XMI.exporter>DiagramFlow</XMI.exporter>',
      '      <XMI.exporterVersion>Enterprise Architect 15.2 compatible</XMI.exporterVersion>',
      '    </XMI.documentation>',
      '  </XMI.header>',
      '  <XMI.content>',
      `    <UML:Model xmi.id="model_${this.escape(diagram.diagramId)}" name="Modelo ${this.escape(diagram.projectId)}">`,
      '      <UML:Namespace.ownedElement>',
      ...classElements,
      ...relationshipElements,
      '      </UML:Namespace.ownedElement>',
      '    </UML:Model>',
      '  </XMI.content>',
      '  <XMI.extensions xmi.extender="Enterprise Architect">',
      `    <EA:Diagram name="Diagrama UML" xmi.id="diagram_${this.escape(diagram.diagramId)}">`,
      '      <EA:Elements>',
      ...visualElements,
      '      </EA:Elements>',
      '      <EA:Connectors>',
      ...visualConnectors,
      '      </EA:Connectors>',
      '    </EA:Diagram>',
      '  </XMI.extensions>',
      '</XMI>',
    ].join('\n');
  }

  private buildClass(
    node: UmlNodeResponseDto,
    classIds: Map<string, string>,
  ): string {
    const classId = classIds.get(node.id) as string;
    const attributes = node.attributes.map(
      (attribute, index) =>
        `          <UML:Attribute xmi.id="${classId}_attribute_${index}" name="${this.escape(attribute.name)}" visibility="${attribute.visibility}" type="${this.escape(attribute.type)}"/>`,
    );
    const operations = node.methods.map((method, index) =>
      [
        `          <UML:Operation xmi.id="${classId}_operation_${index}" name="${this.escape(method.name)}" visibility="${method.visibility}" returnType="${this.escape(method.returnType)}">`,
        `            <UML:BehavioralFeature.parameter>${this.escape(method.parameters)}</UML:BehavioralFeature.parameter>`,
        '          </UML:Operation>',
      ].join('\n'),
    );
    return [
      `        <UML:Class xmi.id="${classId}" name="${this.escape(node.name)}">`,
      '          <UML:Classifier.feature>',
      ...attributes,
      ...operations,
      '          </UML:Classifier.feature>',
      '        </UML:Class>',
    ].join('\n');
  }

  private buildRelationship(
    edge: UmlEdgeResponseDto,
    classIds: Map<string, string>,
  ): string {
    const source = this.escape(classIds.get(edge.sourceId) ?? '');
    const target = this.escape(classIds.get(edge.targetId) ?? '');
    const id = `relationship_${this.escape(edge.id)}`;
    if (edge.type === UmlRelationType.INHERITANCE) {
      return `        <UML:Generalization xmi.id="${id}" child="${source}" parent="${target}"/>`;
    }
    if (edge.type === UmlRelationType.REALIZATION) {
      return `        <UML:Abstraction xmi.id="${id}" client="${source}" supplier="${target}"/>`;
    }
    if (edge.type === UmlRelationType.DEPENDENCY) {
      return `        <UML:Dependency xmi.id="${id}" client="${source}" supplier="${target}"/>`;
    }
    const aggregation =
      edge.type === UmlRelationType.COMPOSITION
        ? 'composite'
        : edge.type === UmlRelationType.AGGREGATION
          ? 'aggregate'
          : 'none';
    return [
      `        <UML:Association xmi.id="${id}">`,
      `          <UML:AssociationEnd xmi.id="${id}_source" participant="${source}" name="${this.escape(edge.sourceRole ?? '')}" aggregation="none" multiplicity="${edge.sourceMin}..${this.upper(edge.sourceMax)}"/>`,
      `          <UML:AssociationEnd xmi.id="${id}_target" participant="${target}" name="${this.escape(edge.targetRole ?? '')}" aggregation="${aggregation}" multiplicity="${edge.targetMin}..${this.upper(edge.targetMax)}"/>`,
      '        </UML:Association>',
    ].join('\n');
  }

  private buildVisualElement(
    node: UmlNodeResponseDto,
    classIds: Map<string, string>,
  ): string {
    return `        <EA:Element xmi.id="element_${this.escape(node.id)}" subject="${this.escape(classIds.get(node.id) ?? '')}" name="${this.escape(node.name)}" x="${Math.round(node.x)}" y="${Math.round(node.y)}" width="220" height="160"/>`;
  }

  private buildVisualConnector(
    edge: UmlEdgeResponseDto,
    classIds: Map<string, string>,
  ): string {
    return `        <EA:Connector xmi.id="connector_${this.escape(edge.id)}" subject="relationship_${this.escape(edge.id)}" source="${this.escape(classIds.get(edge.sourceId) ?? '')}" target="${this.escape(classIds.get(edge.targetId) ?? '')}" type="${edge.type}"/>`;
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UmlDiagramResponseDto = exports.UmlEdgeResponseDto = exports.UmlNodeResponseDto = void 0;
class UmlNodeResponseDto {
    id;
    name;
    tableName;
    description;
    x;
    y;
    attributes;
    methods;
    updatedAt;
}
exports.UmlNodeResponseDto = UmlNodeResponseDto;
class UmlEdgeResponseDto {
    id;
    sourceId;
    targetId;
    type;
    sourceMin;
    sourceMax;
    targetMin;
    targetMax;
    sourceRole;
    targetRole;
    updatedAt;
}
exports.UmlEdgeResponseDto = UmlEdgeResponseDto;
class UmlDiagramResponseDto {
    diagramId;
    projectId;
    version;
    modelType;
    canEdit;
    nodes;
    edges;
}
exports.UmlDiagramResponseDto = UmlDiagramResponseDto;
//# sourceMappingURL=uml-diagram-response.dto.js.map
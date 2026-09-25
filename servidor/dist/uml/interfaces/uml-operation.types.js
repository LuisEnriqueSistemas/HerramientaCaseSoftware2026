"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID_PATTERN = exports.UML_SOCKET_EVENTS = void 0;
exports.UML_SOCKET_EVENTS = {
    DIAGRAM_TYPE_UPDATED: 'uml:diagram_type_updated',
    DIAGRAM_GENERATED: 'uml:diagram_generated',
    NODE_ADDED: 'uml:node_added',
    NODE_UPDATED: 'uml:node_updated',
    NODE_DELETED: 'uml:node_deleted',
    RELATION_ADDED: 'uml:relation_added',
    RELATION_UPDATED: 'uml:relation_updated',
    RELATION_DELETED: 'uml:relation_deleted',
};
exports.UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//# sourceMappingURL=uml-operation.types.js.map
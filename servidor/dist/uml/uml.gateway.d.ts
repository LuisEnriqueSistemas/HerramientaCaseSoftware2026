import { Server, Socket } from 'socket.io';
import { UmlDiagramService } from './uml-diagram.service';
export type UmlAck = {
    ok: true;
} | {
    ok: false;
    error: string;
};
export declare class UmlGateway {
    private readonly umlDiagramService;
    server: Server;
    constructor(umlDiagramService: UmlDiagramService);
    handleDiagramTypeUpdated(client: Socket, payload: unknown): Promise<UmlAck>;
    emitDiagramGenerated(projectId: string, diagram: unknown): void;
    private userIdOf;
    private errorMessage;
    private execute;
    handleNodeAdded(client: Socket, payload: unknown): Promise<UmlAck>;
    handleNodeUpdated(client: Socket, payload: unknown): Promise<UmlAck>;
    handleNodeDeleted(client: Socket, payload: unknown): Promise<UmlAck>;
    handleRelationAdded(client: Socket, payload: unknown): Promise<UmlAck>;
    handleRelationUpdated(client: Socket, payload: unknown): Promise<UmlAck>;
    handleRelationDeleted(client: Socket, payload: unknown): Promise<UmlAck>;
    private isOk;
}

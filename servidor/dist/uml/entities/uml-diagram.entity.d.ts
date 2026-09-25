export declare enum UmlDiagramModelType {
    CLASS = "CLASS",
    ER_LOGICAL = "ER_LOGICAL"
}
export declare class UmlDiagram {
    id: string;
    projectId: string;
    version: number;
    modelType: UmlDiagramModelType;
    createdAt: Date;
    updatedAt: Date;
}

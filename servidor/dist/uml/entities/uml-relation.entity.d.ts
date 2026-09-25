export declare enum UmlRelationType {
    ASSOCIATION = "ASSOCIATION",
    INHERITANCE = "INHERITANCE",
    REALIZATION = "REALIZATION",
    AGGREGATION = "AGGREGATION",
    COMPOSITION = "COMPOSITION",
    DEPENDENCY = "DEPENDENCY"
}
export declare class UmlRelation {
    id: string;
    diagramId: string;
    sourceNodeId: string;
    targetNodeId: string;
    type: UmlRelationType;
    sourceMin: number;
    sourceMax: number | null;
    targetMin: number;
    targetMax: number | null;
    sourceRole: string | null;
    targetRole: string | null;
    createdAt: Date;
    updatedAt: Date;
}

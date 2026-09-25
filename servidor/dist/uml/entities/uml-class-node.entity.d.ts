export type Visibility = 'public' | 'private' | 'protected';
export type ErKeyType = 'NONE' | 'PK' | 'FK';
export interface UmlClassAttribute {
    id?: string;
    visibility: Visibility;
    name: string;
    type: string;
    nullable?: boolean;
    keyType?: ErKeyType;
    isCompositeKey?: boolean;
    referencesEntityId?: string | null;
    referencesAttributeId?: string | null;
    unique?: boolean;
}
export interface UmlClassMethod {
    visibility: Visibility;
    name: string;
    parameters: string;
    returnType: string;
}
export declare class UmlClassNode {
    id: string;
    diagramId: string;
    name: string;
    tableName: string | null;
    description: string | null;
    positionX: number;
    positionY: number;
    attributes: UmlClassAttribute[];
    methods: UmlClassMethod[];
    createdAt: Date;
    updatedAt: Date;
}

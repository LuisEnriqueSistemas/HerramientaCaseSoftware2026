export declare const InjectRepository: () => (target: object, propertyKey: string | undefined, parameterIndex: number) => void;
export declare const getRepositoryToken: (entity: string) => string;
export declare const TypeOrmModule: {
    forFeature: () => {};
    forRoot: () => {};
    forRootAsync: () => {};
};
export declare const Entity: () => ((target: unknown) => void);
export declare const Column: () => ((target: unknown) => void);
export declare const CreateDateColumn: () => ((target: unknown) => void);
export declare const UpdateDateColumn: () => ((target: unknown) => void);
export declare const PrimaryGeneratedColumn: () => ((target: unknown) => void);
export declare const Index: () => ((target: unknown) => void);
export declare const In: (values: unknown[]) => unknown;
export declare class Repository<T> {
    items: T[];
}
export declare class DataSource {
}

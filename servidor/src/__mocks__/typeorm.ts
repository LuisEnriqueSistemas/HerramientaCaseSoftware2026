const decoratorFactory =
  (): ((target: unknown) => void) =>
  (_target: unknown): void => {
    const unused = _target;
    void unused;
  };

export const InjectRepository =
  () =>
  (
    target: object,
    propertyKey: string | undefined,
    parameterIndex: number,
  ): void => {
    const unused = [target, propertyKey, parameterIndex];
    void unused;
  };

export const getRepositoryToken = (entity: string): string =>
  `TYPEORM_REPOSITORY_${entity}`;

export const TypeOrmModule = {
  forFeature: () => ({}),
  forRoot: () => ({}),
  forRootAsync: () => ({}),
};

export const Entity = decoratorFactory;
export const Column = decoratorFactory;
export const CreateDateColumn = decoratorFactory;
export const UpdateDateColumn = decoratorFactory;
export const PrimaryGeneratedColumn = decoratorFactory;
export const Index = decoratorFactory;

export const In = (values: unknown[]): unknown => ({ value: values });

export class Repository<T> {
  items: T[] = [];
}

export class DataSource {}

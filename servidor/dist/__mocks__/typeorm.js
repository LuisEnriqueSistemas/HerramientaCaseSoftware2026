"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSource = exports.Repository = exports.In = exports.Index = exports.PrimaryGeneratedColumn = exports.UpdateDateColumn = exports.CreateDateColumn = exports.Column = exports.Entity = exports.TypeOrmModule = exports.getRepositoryToken = exports.InjectRepository = void 0;
const decoratorFactory = () => (_target) => {
    const unused = _target;
    void unused;
};
const InjectRepository = () => (target, propertyKey, parameterIndex) => {
    const unused = [target, propertyKey, parameterIndex];
    void unused;
};
exports.InjectRepository = InjectRepository;
const getRepositoryToken = (entity) => `TYPEORM_REPOSITORY_${entity}`;
exports.getRepositoryToken = getRepositoryToken;
exports.TypeOrmModule = {
    forFeature: () => ({}),
    forRoot: () => ({}),
    forRootAsync: () => ({}),
};
exports.Entity = decoratorFactory;
exports.Column = decoratorFactory;
exports.CreateDateColumn = decoratorFactory;
exports.UpdateDateColumn = decoratorFactory;
exports.PrimaryGeneratedColumn = decoratorFactory;
exports.Index = decoratorFactory;
const In = (values) => ({ value: values });
exports.In = In;
class Repository {
    items = [];
}
exports.Repository = Repository;
class DataSource {
}
exports.DataSource = DataSource;
//# sourceMappingURL=typeorm.js.map
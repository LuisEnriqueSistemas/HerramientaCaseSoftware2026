"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmUsersRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
let TypeOrmUsersRepository = class TypeOrmUsersRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    findByEmail(email) {
        return this.repository.findOne({ where: { email } });
    }
    findById(id) {
        return this.repository.findOne({ where: { id } });
    }
    async findManyByIds(ids) {
        if (ids.length === 0) {
            return [];
        }
        return this.repository.find({ where: ids.map((id) => ({ id })) });
    }
    async createAndSave(data) {
        const user = this.repository.create(data);
        return this.repository.save(user);
    }
    async update(id, data) {
        const user = await this.findById(id);
        if (!user) {
            return null;
        }
        Object.assign(user, data);
        return this.repository.save(user);
    }
    async remove(id) {
        await this.repository.delete(id);
    }
};
exports.TypeOrmUsersRepository = TypeOrmUsersRepository;
exports.TypeOrmUsersRepository = TypeOrmUsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TypeOrmUsersRepository);
//# sourceMappingURL=typeorm-users.repository.js.map
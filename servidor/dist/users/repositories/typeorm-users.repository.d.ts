import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserCreationData, UserUpdateData, UsersRepository } from './users-repository.interface';
export declare class TypeOrmUsersRepository implements UsersRepository {
    private readonly repository;
    constructor(repository: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findManyByIds(ids: string[]): Promise<User[]>;
    createAndSave(data: UserCreationData): Promise<User>;
    update(id: string, data: UserUpdateData): Promise<User | null>;
    remove(id: string): Promise<void>;
}

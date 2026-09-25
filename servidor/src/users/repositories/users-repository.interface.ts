import { User } from '../entities/user.entity';

export interface UserCreationData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  passwordHash?: string;
}

export interface UsersRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findManyByIds(ids: string[]): Promise<User[]>;
  createAndSave(data: UserCreationData): Promise<User>;
  update(id: string, data: UserUpdateData): Promise<User | null>;
  remove(id: string): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import {
  UserCreationData,
  UserUpdateData,
  UsersRepository,
} from './users-repository.interface';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repository.find({ where: ids.map((id) => ({ id })) });
  }

  async createAndSave(data: UserCreationData): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async update(id: string, data: UserUpdateData): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    Object.assign(user, data);
    return this.repository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import {
  ProjectCreationData,
  ProjectsRepository,
} from './projects-repository.interface';

@Injectable()
export class TypeOrmProjectsRepository implements ProjectsRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
  ) {}

  async createAndSave(data: ProjectCreationData): Promise<Project> {
    const project = this.repository.create(data);
    return this.repository.save(project);
  }

  findById(id: string): Promise<Project | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Project[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repository.find({ where: ids.map((id) => ({ id })) });
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

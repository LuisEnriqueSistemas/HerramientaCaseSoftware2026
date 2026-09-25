import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectCreationData, ProjectsRepository } from './projects-repository.interface';
export declare class TypeOrmProjectsRepository implements ProjectsRepository {
    private readonly repository;
    constructor(repository: Repository<Project>);
    createAndSave(data: ProjectCreationData): Promise<Project>;
    findById(id: string): Promise<Project | null>;
    findByIds(ids: string[]): Promise<Project[]>;
    remove(id: string): Promise<void>;
}

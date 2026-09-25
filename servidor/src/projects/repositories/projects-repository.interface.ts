import { Project } from '../entities/project.entity';

export interface ProjectCreationData {
  name: string;
  description: string | null;
  createdBy: string;
}

export interface ProjectsRepository {
  createAndSave(data: ProjectCreationData): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByIds(ids: string[]): Promise<Project[]>;
  remove(id: string): Promise<void>;
}

export const PROJECTS_REPOSITORY = Symbol('PROJECTS_REPOSITORY');

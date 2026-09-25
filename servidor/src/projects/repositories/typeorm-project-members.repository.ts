import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjectMember,
  ProjectMemberRole,
} from '../entities/project-member.entity';
import { ProjectMembersRepository } from './project-members-repository.interface';

@Injectable()
export class TypeOrmProjectMembersRepository implements ProjectMembersRepository {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly repository: Repository<ProjectMember>,
  ) {}

  async add(
    projectId: string,
    userId: string,
    role: ProjectMemberRole,
  ): Promise<ProjectMember> {
    const member = this.repository.create({ projectId, userId, role });
    return this.repository.save(member);
  }

  find(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.repository.findOne({ where: { projectId, userId } });
  }

  listByProject(projectId: string): Promise<ProjectMember[]> {
    return this.repository.find({ where: { projectId } });
  }

  listByUser(userId: string): Promise<ProjectMember[]> {
    return this.repository.find({ where: { userId } });
  }

  async updateRole(
    projectId: string,
    userId: string,
    role: ProjectMemberRole,
  ): Promise<ProjectMember | null> {
    const member = await this.find(projectId, userId);
    if (!member) {
      return null;
    }
    member.role = role;
    return this.repository.save(member);
  }

  async remove(projectId: string, userId: string): Promise<void> {
    await this.repository.delete({ projectId, userId });
  }

  async removeByProject(projectId: string): Promise<void> {
    await this.repository.delete({ projectId });
  }
}

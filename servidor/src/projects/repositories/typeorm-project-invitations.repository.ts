import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjectInvitation,
  ProjectInvitationStatus,
} from '../entities/project-invitation.entity';
import {
  InvitationCreationData,
  ProjectInvitationsRepository,
} from './project-invitations-repository.interface';

@Injectable()
export class TypeOrmProjectInvitationsRepository implements ProjectInvitationsRepository {
  constructor(
    @InjectRepository(ProjectInvitation)
    private readonly repository: Repository<ProjectInvitation>,
  ) {}

  async createAndSave(
    data: InvitationCreationData,
  ): Promise<ProjectInvitation> {
    const invitation = this.repository.create(data);
    return this.repository.save(invitation);
  }

  findById(id: string): Promise<ProjectInvitation | null> {
    return this.repository.findOne({ where: { id } });
  }

  findPendingByEmail(email: string): Promise<ProjectInvitation[]> {
    return this.repository.find({
      where: {
        email,
        status: ProjectInvitationStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  findPendingByProjectAndEmail(
    projectId: string,
    email: string,
  ): Promise<ProjectInvitation | null> {
    return this.repository.findOne({
      where: {
        projectId,
        email,
        status: ProjectInvitationStatus.PENDING,
      },
    });
  }

  async updateStatus(
    id: string,
    status: ProjectInvitationStatus,
  ): Promise<ProjectInvitation | null> {
    const invitation = await this.findById(id);
    if (!invitation) {
      return null;
    }
    invitation.status = status;
    return this.repository.save(invitation);
  }

  async removeByProject(projectId: string): Promise<void> {
    await this.repository.delete({ projectId });
  }
}

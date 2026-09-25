import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectMemberRole } from './project-member.entity';

export enum ProjectInvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('project_invitations')
export class ProjectInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'invited_by_user_id' })
  invitedByUserId: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: ProjectMemberRole })
  role: ProjectMemberRole;

  @Column({
    type: 'enum',
    enum: ProjectInvitationStatus,
    default: ProjectInvitationStatus.PENDING,
  })
  status: ProjectInvitationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProjectMemberRole {
  HOST = 'HOST',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

@Entity('project_members')
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: ProjectMemberRole })
  role: ProjectMemberRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UmlDiagramModelType {
  CLASS = 'CLASS',
  ER_LOGICAL = 'ER_LOGICAL',
}

@Entity('uml_diagrams')
export class UmlDiagram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('uq_uml_diagrams_project_id', { unique: true })
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({
    name: 'model_type',
    type: 'enum',
    enum: UmlDiagramModelType,
    default: UmlDiagramModelType.ER_LOGICAL,
  })
  modelType: UmlDiagramModelType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

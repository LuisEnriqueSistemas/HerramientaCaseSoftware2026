import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UmlRelationType {
  ASSOCIATION = 'ASSOCIATION',
  INHERITANCE = 'INHERITANCE',
  REALIZATION = 'REALIZATION',
  AGGREGATION = 'AGGREGATION',
  COMPOSITION = 'COMPOSITION',
  DEPENDENCY = 'DEPENDENCY',
}

@Entity('uml_relations')
export class UmlRelation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'diagram_id' })
  diagramId: string;

  @Column({ name: 'source_node_id' })
  sourceNodeId: string;

  @Column({ name: 'target_node_id' })
  targetNodeId: string;

  @Column({ type: 'enum', enum: UmlRelationType })
  type: UmlRelationType;

  @Column({ name: 'source_min', type: 'int', default: 1 })
  sourceMin: number;

  @Column({ name: 'source_max', type: 'int', nullable: true })
  sourceMax: number | null;

  @Column({ name: 'target_min', type: 'int', default: 1 })
  targetMin: number;

  @Column({ name: 'target_max', type: 'int', nullable: true })
  targetMax: number | null;

  @Column({ name: 'source_role', type: 'varchar', length: 64, nullable: true })
  sourceRole: string | null;

  @Column({ name: 'target_role', type: 'varchar', length: 64, nullable: true })
  targetRole: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

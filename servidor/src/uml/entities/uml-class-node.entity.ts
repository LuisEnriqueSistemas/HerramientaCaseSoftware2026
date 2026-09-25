import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type Visibility = 'public' | 'private' | 'protected';
export type ErKeyType = 'NONE' | 'PK' | 'FK';

export interface UmlClassAttribute {
  id?: string;
  visibility: Visibility;
  name: string;
  type: string;
  nullable?: boolean;
  keyType?: ErKeyType;
  isCompositeKey?: boolean;
  referencesEntityId?: string | null;
  referencesAttributeId?: string | null;
  unique?: boolean;
}

export interface UmlClassMethod {
  visibility: Visibility;
  name: string;
  parameters: string;
  returnType: string;
}

@Entity('uml_classes')
export class UmlClassNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'diagram_id' })
  diagramId: string;

  @Column({ length: 120 })
  name: string;

  @Column({
    name: 'table_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  tableName: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'position_x', type: 'float' })
  positionX: number;

  @Column({ name: 'position_y', type: 'float' })
  positionY: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attributes: UmlClassAttribute[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  methods: UmlClassMethod[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

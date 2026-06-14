import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('class_access')
export class ClassAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  className: string;

  @Column({ default: false })
  isActive: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}

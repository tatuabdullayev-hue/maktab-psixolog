import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { RiskLevel } from './risk-score.entity';

@Entity('life_choices_results')
export class LifeChoicesResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'jsonb' })
  answers: string[];

  @Column({ type: 'int' })
  riskyCount: number;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'enum', enum: RiskLevel })
  level: RiskLevel;

  @CreateDateColumn()
  completedAt: Date;
}

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

@Entity('color_test_results')
export class ColorTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'jsonb' })
  order: string[];

  @Column({ type: 'int' })
  anxietyColorsInTop: number;

  @Column({ type: 'int' })
  colorPoints: number;

  @Column({ type: 'enum', enum: RiskLevel })
  level: RiskLevel;

  @CreateDateColumn()
  completedAt: Date;
}

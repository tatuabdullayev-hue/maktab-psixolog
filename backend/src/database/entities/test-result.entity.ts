import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Test } from './test.entity';
import { RiskLevel } from './risk-score.entity';

@Entity('test_results')
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (student) => student.testResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Test, (test) => test.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column()
  testId: string;

  @Column({ type: 'jsonb' })
  answers: Record<string, string>;

  @Column({ type: 'int' })
  correctCount: number;

  @Column({ type: 'int' })
  totalCount: number;

  @Column({ type: 'int' })
  scorePercent: number;

  @Column({ type: 'int', default: 0 })
  riskPoints: number;

  @Column({ type: 'jsonb', nullable: true })
  domainScores: Record<string, number>;

  @Column({ type: 'enum', enum: RiskLevel, nullable: true })
  aiRiskLevel: RiskLevel | null;

  @Column({ type: 'text', nullable: true })
  aiInsight: string | null;

  @Column({ type: 'text', nullable: true })
  aiRecommendation: string | null;

  @CreateDateColumn()
  completedAt: Date;
}

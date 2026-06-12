import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

export enum RiskLevel {
  NORMAL = 'normal',
  ATTENTION = 'attention',
  DANGER = 'danger',
}

@Entity('risk_scores')
export class RiskScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (student) => student.riskScores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'enum', enum: RiskLevel })
  level: RiskLevel;

  @Column({ type: 'jsonb', nullable: true })
  factors: Record<string, number>;

  @CreateDateColumn()
  calculatedAt: Date;
}

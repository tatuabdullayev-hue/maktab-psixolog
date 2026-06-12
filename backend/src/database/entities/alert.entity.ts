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

export enum AlertType {
  RISK_INCREASE = 'risk_increase',
  LOW_MOOD_STREAK = 'low_mood_streak',
  TEST_RESULT = 'test_result',
  CHAT_FLAG = 'chat_flag',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (student) => student.alerts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: RiskLevel })
  level: RiskLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

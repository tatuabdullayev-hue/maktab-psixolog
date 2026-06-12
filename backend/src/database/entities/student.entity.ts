import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { MoodEntry } from './mood-entry.entity';
import { TestResult } from './test-result.entity';
import { ChatMessage } from './chat-message.entity';
import { RiskScore } from './risk-score.entity';
import { Alert } from './alert.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true, nullable: true })
  telegramId: string | null;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  className: string;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  schoolName: string;

  @Column({ nullable: true })
  district: string;

  @Column({ default: 0 })
  currentRiskScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => MoodEntry, (entry) => entry.student)
  moodEntries: MoodEntry[];

  @OneToMany(() => TestResult, (result) => result.student)
  testResults: TestResult[];

  @OneToMany(() => ChatMessage, (message) => message.student)
  chatMessages: ChatMessage[];

  @OneToMany(() => RiskScore, (score) => score.student)
  riskScores: RiskScore[];

  @OneToMany(() => Alert, (alert) => alert.student)
  alerts: Alert[];
}

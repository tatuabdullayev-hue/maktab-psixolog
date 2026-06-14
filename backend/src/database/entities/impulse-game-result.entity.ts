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

@Entity('impulse_game_results')
export class ImpulseGameResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'int' })
  goTotal: number;

  @Column({ type: 'int' })
  omissionErrors: number;

  @Column({ type: 'int' })
  noGoTotal: number;

  @Column({ type: 'int' })
  commissionErrors: number;

  @Column({ type: 'int' })
  avgReactionTimeMs: number;

  @Column({ type: 'int' })
  reactionTimeSdMs: number;

  @Column({ type: 'int' })
  impulsePoints: number;

  @Column({ type: 'enum', enum: RiskLevel })
  level: RiskLevel;

  @CreateDateColumn()
  completedAt: Date;
}

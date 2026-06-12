import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { TestResult } from './test-result.entity';

export interface TestQuestionOption {
  key: string;
  text: string;
  riskWeight: number;
}

export type TestQuestionDomain =
  | 'aggression'
  | 'bullying'
  | 'emotional'
  | 'peer'
  | 'conduct'
  | 'substance'
  | 'prosocial';

export interface TestQuestion {
  id: string;
  text: string;
  imageUrl?: string;
  domain: TestQuestionDomain;
  options: TestQuestionOption[];
  correctKey?: string;
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  questions: TestQuestion[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => TestResult, (result) => result.test)
  results: TestResult[];
}

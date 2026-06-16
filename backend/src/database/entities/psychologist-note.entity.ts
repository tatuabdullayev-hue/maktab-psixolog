import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

export enum NoteType {
  STUDENT_TALK = 'student_talk',
  PARENT_TALK = 'parent_talk',
  TEACHER_TALK = 'teacher_talk',
  OTHER = 'other',
}

@Entity('psychologist_notes')
export class PsychologistNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'enum', enum: NoteType, default: NoteType.STUDENT_TALK })
  type: NoteType;

  @Column({ type: 'text' })
  note: string;

  @Column({ type: 'text', nullable: true })
  nextStep: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}

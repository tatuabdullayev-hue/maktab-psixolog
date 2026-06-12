import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  PSYCHOLOGIST = 'psychologist',
}

@Entity('psychologists')
export class Psychologist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true, nullable: true })
  telegramId: string;

  @Column()
  fullName: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PSYCHOLOGIST })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}

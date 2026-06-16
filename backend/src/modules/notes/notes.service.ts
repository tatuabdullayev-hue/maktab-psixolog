import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsychologistNote, NoteType } from '../../database/entities/psychologist-note.entity';
import { TestResult } from '../../database/entities/test-result.entity';
import { RiskLevel } from '../../database/entities/risk-score.entity';

interface CreateNoteDto {
  studentId: string;
  type: NoteType;
  note: string;
  nextStep?: string;
}

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(PsychologistNote)
    private readonly repo: Repository<PsychologistNote>,
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
  ) {}

  create(dto: CreateNoteDto) {
    const entity = this.repo.create({
      studentId: dto.studentId,
      type: dto.type,
      note: dto.note,
      nextStep: dto.nextStep ?? null,
    });
    return this.repo.save(entity);
  }

  getByStudent(studentId: string) {
    return this.repo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  getAll(school?: string, district?: string) {
    return this.repo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.student', 'student')
      .where(school ? 'student.schoolName = :school' : '1=1', { school })
      .andWhere(district ? 'student.district = :district' : '1=1', { district })
      .orderBy('n.createdAt', 'DESC')
      .getMany();
  }

  async unattendedCount(school?: string, district?: string): Promise<number> {
    // Danger darajadagi o'quvchilar (oxirgi test natijasi bo'yicha)
    const dangerResults = await this.testResultRepo
      .createQueryBuilder('tr')
      .innerJoinAndSelect('tr.student', 'student')
      .where('tr.aiRiskLevel = :level', { level: RiskLevel.DANGER })
      .andWhere(school ? 'student.schoolName = :school' : '1=1', { school })
      .andWhere(district ? 'student.district = :district' : '1=1', { district })
      .distinctOn(['tr.studentId'])
      .orderBy('tr.studentId')
      .addOrderBy('tr.completedAt', 'DESC')
      .getMany();

    // Ulardan qaysi biri hali hech qanday ish kiritilmagan
    const studentIds = dangerResults.map(r => r.studentId);
    if (studentIds.length === 0) return 0;

    const withNotes = await this.repo
      .createQueryBuilder('n')
      .select('DISTINCT n.studentId', 'studentId')
      .where('n.studentId IN (:...ids)', { ids: studentIds })
      .getRawMany();

    const attendedIds = new Set(withNotes.map(r => r.studentId));
    return studentIds.filter(id => !attendedIds.has(id)).length;
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}

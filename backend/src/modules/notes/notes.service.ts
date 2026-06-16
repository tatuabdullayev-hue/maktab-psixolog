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
    const dangerStudents = await this.testResultRepo
      .createQueryBuilder('tr')
      .select('DISTINCT tr.studentId', 'studentId')
      .innerJoin('tr.student', 'student')
      .where('tr.aiRiskLevel = :level', { level: RiskLevel.DANGER })
      .andWhere(school ? 'student.schoolName = :school' : '1=1', { school })
      .andWhere(district ? 'student.district = :district' : '1=1', { district })
      .getRawMany();

    const studentIds: string[] = dangerStudents.map((r: { studentId: string }) => r.studentId);
    if (studentIds.length === 0) return 0;

    // Faqat [NAZORAT_CHIQISH] note bor o'quvchilarni chiqaramiz (oddiy ish notalari chiqarmaydi)
    const finishedNotes = await this.repo
      .createQueryBuilder('n')
      .select('DISTINCT n.studentId', 'studentId')
      .where('n.studentId IN (:...ids)', { ids: studentIds })
      .andWhere("n.note LIKE '[NAZORAT_CHIQISH]%'")
      .getRawMany();

    const finishedIds = new Set(finishedNotes.map((r: { studentId: string }) => r.studentId));
    return studentIds.filter(id => !finishedIds.has(id)).length;
  }

  async unattendedStudents(school?: string, district?: string) {
    const dangerStudents = await this.testResultRepo
      .createQueryBuilder('tr')
      .select('tr.studentId', 'studentId')
      .addSelect('student.firstName', 'firstName')
      .addSelect('student.lastName', 'lastName')
      .addSelect('student.className', 'className')
      .innerJoin('tr.student', 'student')
      .where('tr.aiRiskLevel = :level', { level: RiskLevel.DANGER })
      .andWhere(school ? 'student.schoolName = :school' : '1=1', { school })
      .andWhere(district ? 'student.district = :district' : '1=1', { district })
      .groupBy('tr.studentId')
      .addGroupBy('student.firstName')
      .addGroupBy('student.lastName')
      .addGroupBy('student.className')
      .getRawMany();

    if (dangerStudents.length === 0) return [];

    const studentIds: string[] = dangerStudents.map((r: any) => r.studentId);

    // Faqat [NAZORAT_CHIQISH] note bor o'quvchilarni ro'yxatdan chiqaramiz
    const finishedNotes = await this.repo
      .createQueryBuilder('n')
      .select('DISTINCT n.studentId', 'studentId')
      .where('n.studentId IN (:...ids)', { ids: studentIds })
      .andWhere("n.note LIKE '[NAZORAT_CHIQISH]%'")
      .getRawMany();

    const finishedIds = new Set(finishedNotes.map((r: any) => r.studentId));
    return dangerStudents
      .filter((r: any) => !finishedIds.has(r.studentId))
      .map((r: any) => ({
        studentId: r.studentId,
        fullName: `${r.firstName} ${r.lastName ?? ''}`.trim(),
        className: r.className ?? '',
      }));
  }

  delete(id: string) {
    return this.repo.softDelete(id);
  }
}

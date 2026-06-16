import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsychologistNote, NoteType } from '../../database/entities/psychologist-note.entity';

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

  delete(id: string) {
    return this.repo.delete(id);
  }
}

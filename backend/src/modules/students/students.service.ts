import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../database/entities';

interface TelegramProfile {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async findOrCreateByTelegram(profile: TelegramProfile): Promise<Student> {
    let student = await this.studentRepo.findOne({
      where: { telegramId: String(profile.id) },
    });

    if (!student) {
      student = this.studentRepo.create({
        telegramId: String(profile.id),
        firstName: profile.first_name,
        lastName: profile.last_name,
        username: profile.username,
      });
      await this.studentRepo.save(student);
    }

    return student;
  }

  async createWebStudent(data: {
    firstName: string;
    lastName: string;
    className: string;
    age?: number;
    schoolName?: string;
    district?: string;
  }): Promise<Student> {
    const student = this.studentRepo.create({
      telegramId: null,
      firstName: data.firstName,
      lastName: data.lastName,
      className: data.className,
      age: data.age ?? null,
      schoolName: data.schoolName,
      district: data.district,
    });
    return this.studentRepo.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.studentRepo.find({
      order: { currentRiskScore: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
    }
    return student;
  }

  async updateProfile(
    id: string,
    data: { className?: string },
  ): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, data);
    return this.studentRepo.save(student);
  }

  async updateRiskScore(id: string, score: number): Promise<void> {
    await this.studentRepo.update(id, { currentRiskScore: score });
  }
}

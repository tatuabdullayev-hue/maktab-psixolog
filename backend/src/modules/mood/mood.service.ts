import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoodEntry } from '../../database/entities';
import { RiskService } from '../risk/risk.service';
import { CreateMoodDto } from './dto/create-mood.dto';

@Injectable()
export class MoodService {
  constructor(
    @InjectRepository(MoodEntry)
    private readonly moodRepo: Repository<MoodEntry>,
    private readonly riskService: RiskService,
  ) {}

  async create(studentId: string, dto: CreateMoodDto): Promise<MoodEntry> {
    const entry = this.moodRepo.create({ studentId, ...dto });
    await this.moodRepo.save(entry);
    await this.riskService.recalculate(studentId);
    return entry;
  }

  async getHistory(studentId: string, days = 30): Promise<MoodEntry[]> {
    return this.moodRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: days,
    });
  }
}

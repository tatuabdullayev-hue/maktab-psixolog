import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../../database/entities';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
  ) {}

  async findAll(onlyUnresolved = true): Promise<Alert[]> {
    return this.alertRepo.find({
      where: onlyUnresolved ? { isResolved: false } : {},
      order: { createdAt: 'DESC' },
      relations: ['student'],
    });
  }

  async resolve(id: string): Promise<Alert> {
    await this.alertRepo.update(id, { isResolved: true });
    return this.alertRepo.findOne({ where: { id } });
  }

  async findForStudent(studentId: string): Promise<Alert[]> {
    return this.alertRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }
}

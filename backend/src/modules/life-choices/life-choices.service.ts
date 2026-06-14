import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LifeChoicesResult, RiskLevel } from '../../database/entities';
import { RiskService } from '../risk/risk.service';
import { SubmitLifeChoicesDto } from './dto/submit-life-choices.dto';

const POINTS: Record<RiskLevel, number> = {
  [RiskLevel.NORMAL]: 0,
  [RiskLevel.ATTENTION]: 10,
  [RiskLevel.DANGER]: 20,
};

@Injectable()
export class LifeChoicesService {
  constructor(
    @InjectRepository(LifeChoicesResult)
    private readonly lifeChoicesRepo: Repository<LifeChoicesResult>,
    private readonly riskService: RiskService,
  ) {}

  async submit(studentId: string, dto: SubmitLifeChoicesDto): Promise<LifeChoicesResult> {
    const riskyCount = dto.answers.filter((answer) => answer === 'a').length;

    let level: RiskLevel;
    if (riskyCount >= 6) {
      level = RiskLevel.DANGER;
    } else if (riskyCount >= 3) {
      level = RiskLevel.ATTENTION;
    } else {
      level = RiskLevel.NORMAL;
    }

    const result = this.lifeChoicesRepo.create({
      studentId,
      answers: dto.answers,
      riskyCount,
      points: POINTS[level],
      level,
    });
    await this.lifeChoicesRepo.save(result);

    await this.riskService.addLifeChoicesResult(studentId, level);

    return result;
  }
}

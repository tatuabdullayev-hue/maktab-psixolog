import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImpulseGameResult, RiskLevel } from '../../database/entities';
import { RiskService } from '../risk/risk.service';
import { SubmitImpulseGameDto } from './dto/submit-impulse-game.dto';

@Injectable()
export class ImpulseGameService {
  constructor(
    @InjectRepository(ImpulseGameResult)
    private readonly impulseGameRepo: Repository<ImpulseGameResult>,
    private readonly riskService: RiskService,
  ) {}

  async submit(studentId: string, dto: SubmitImpulseGameDto): Promise<ImpulseGameResult> {
    const commissionErrorRate = dto.noGoTotal
      ? dto.commissionErrors / dto.noGoTotal
      : 0;

    let level: RiskLevel;
    if (commissionErrorRate > 0.35) {
      level = RiskLevel.DANGER;
    } else if (commissionErrorRate > 0.15) {
      level = RiskLevel.ATTENTION;
    } else {
      level = RiskLevel.NORMAL;
    }

    const IMPULSE_POINTS: Record<RiskLevel, number> = {
      [RiskLevel.NORMAL]: 0,
      [RiskLevel.ATTENTION]: 10,
      [RiskLevel.DANGER]: 20,
    };

    const result = this.impulseGameRepo.create({
      studentId,
      goTotal: dto.goTotal,
      omissionErrors: dto.omissionErrors,
      noGoTotal: dto.noGoTotal,
      commissionErrors: dto.commissionErrors,
      avgReactionTimeMs: dto.avgReactionTimeMs,
      reactionTimeSdMs: dto.reactionTimeSdMs,
      impulsePoints: IMPULSE_POINTS[level],
      level,
    });
    await this.impulseGameRepo.save(result);

    await this.riskService.addImpulseResult(studentId, level);

    return result;
  }
}

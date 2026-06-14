import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColorTestResult, RiskLevel } from '../../database/entities';
import { RiskService } from '../risk/risk.service';
import { SubmitColorTestDto } from './dto/submit-color-test.dto';

const ANXIETY_COLORS = new Set(['black', 'grey', 'brown', 'violet']);
const TOP_POSITIONS = 3;

@Injectable()
export class ColorTestService {
  constructor(
    @InjectRepository(ColorTestResult)
    private readonly colorTestRepo: Repository<ColorTestResult>,
    private readonly riskService: RiskService,
  ) {}

  async submit(studentId: string, dto: SubmitColorTestDto): Promise<ColorTestResult> {
    const topColors = dto.order.slice(0, TOP_POSITIONS);
    const anxietyColorsInTop = topColors.filter((color) => ANXIETY_COLORS.has(color)).length;

    let level: RiskLevel;
    if (anxietyColorsInTop >= 2) {
      level = RiskLevel.DANGER;
    } else if (anxietyColorsInTop === 1) {
      level = RiskLevel.ATTENTION;
    } else {
      level = RiskLevel.NORMAL;
    }

    const COLOR_POINTS: Record<RiskLevel, number> = {
      [RiskLevel.NORMAL]: 0,
      [RiskLevel.ATTENTION]: 10,
      [RiskLevel.DANGER]: 20,
    };

    const result = this.colorTestRepo.create({
      studentId,
      order: dto.order,
      anxietyColorsInTop,
      colorPoints: COLOR_POINTS[level],
      level,
    });
    await this.colorTestRepo.save(result);

    await this.riskService.addColorTestResult(studentId, level);

    return result;
  }
}

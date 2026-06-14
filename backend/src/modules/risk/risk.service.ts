import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RiskScore,
  RiskLevel,
  Alert,
  AlertType,
  MoodEntry,
  MoodLevel,
  TestResult,
  Student,
} from '../../database/entities';

const MOOD_WEIGHTS: Record<MoodLevel, number> = {
  [MoodLevel.GREAT]: 0,
  [MoodLevel.NORMAL]: 10,
  [MoodLevel.BAD]: 25,
  [MoodLevel.VERY_BAD]: 40,
};

const LOW_MOODS = [MoodLevel.BAD, MoodLevel.VERY_BAD];

@Injectable()
export class RiskService {
  constructor(
    @InjectRepository(RiskScore)
    private readonly riskScoreRepo: Repository<RiskScore>,
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
    @InjectRepository(MoodEntry)
    private readonly moodRepo: Repository<MoodEntry>,
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async recalculate(studentId: string): Promise<RiskScore> {
    const recentMoods = await this.moodRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: 7,
    });

    const moodComponent = recentMoods.length
      ? Math.round(
          recentMoods.reduce((sum, m) => sum + MOOD_WEIGHTS[m.mood], 0) /
            recentMoods.length,
        )
      : 0;

    const latestTestResult = await this.testResultRepo.findOne({
      where: { studentId },
      order: { completedAt: 'DESC' },
    });

    const testComponent = Math.min(latestTestResult?.riskPoints ?? 0, 50);

    const score = Math.min(moodComponent + testComponent, 100);
    const level = this.scoreToLevel(score);

    const factors = {
      mood: moodComponent,
      test: testComponent,
    };

    const riskScore = this.riskScoreRepo.create({
      studentId,
      score,
      level,
      factors,
    });
    await this.riskScoreRepo.save(riskScore);
    await this.studentRepo.update(studentId, { currentRiskScore: score });

    await this.maybeCreateRiskAlert(studentId, score, level);
    await this.maybeCreateMoodStreakAlert(studentId, recentMoods);

    return riskScore;
  }

  /** Web-test oqimi uchun: AI tahlili va bugungi kayfiyat asosida risk darajasini yangilaydi. */
  async recalculateFromAi(studentId: string, level: RiskLevel, mood?: MoodLevel): Promise<RiskScore> {
    const LEVEL_SCORES: Record<RiskLevel, number> = {
      [RiskLevel.NORMAL]: 20,
      [RiskLevel.ATTENTION]: 55,
      [RiskLevel.DANGER]: 85,
    };
    const aiComponent = LEVEL_SCORES[level];
    const moodComponent = mood ? MOOD_WEIGHTS[mood] : 0;
    const score = Math.min(aiComponent + moodComponent, 100);
    const finalLevel = mood ? this.scoreToLevel(score) : level;

    const riskScore = this.riskScoreRepo.create({
      studentId,
      score,
      level: finalLevel,
      factors: { aiAnalysis: aiComponent, mood: moodComponent },
    });
    await this.riskScoreRepo.save(riskScore);
    await this.studentRepo.update(studentId, { currentRiskScore: score });

    await this.maybeCreateRiskAlert(studentId, score, finalLevel);

    return riskScore;
  }

  /** Go/No-Go o'yini natijasi asosida umumiy risk ballini yangilaydi (impulsivlik komponenti). */
  async addImpulseResult(studentId: string, impulseLevel: RiskLevel): Promise<RiskScore> {
    const IMPULSE_SCORES: Record<RiskLevel, number> = {
      [RiskLevel.NORMAL]: 0,
      [RiskLevel.ATTENTION]: 10,
      [RiskLevel.DANGER]: 20,
    };
    const impulseComponent = IMPULSE_SCORES[impulseLevel];

    const latest = await this.riskScoreRepo.findOne({
      where: { studentId },
      order: { calculatedAt: 'DESC' },
    });

    const previousFactors = latest?.factors ?? {};
    const baseComponents = Object.entries(previousFactors)
      .filter(([key]) => key !== 'impulse')
      .reduce((sum, [, value]) => sum + value, 0);

    const score = Math.min(baseComponents + impulseComponent, 100);
    const level = this.scoreToLevel(score);

    const riskScore = this.riskScoreRepo.create({
      studentId,
      score,
      level,
      factors: { ...previousFactors, impulse: impulseComponent },
    });
    await this.riskScoreRepo.save(riskScore);
    await this.studentRepo.update(studentId, { currentRiskScore: score });

    await this.maybeCreateRiskAlert(studentId, score, level);

    return riskScore;
  }

  /** Rang testi (Lyusher) natijasi asosida umumiy risk ballini yangilaydi (stress/tashvish komponenti). */
  async addColorTestResult(studentId: string, colorLevel: RiskLevel): Promise<RiskScore> {
    const COLOR_SCORES: Record<RiskLevel, number> = {
      [RiskLevel.NORMAL]: 0,
      [RiskLevel.ATTENTION]: 10,
      [RiskLevel.DANGER]: 20,
    };
    const colorComponent = COLOR_SCORES[colorLevel];

    const latest = await this.riskScoreRepo.findOne({
      where: { studentId },
      order: { calculatedAt: 'DESC' },
    });

    const previousFactors = latest?.factors ?? {};
    const baseComponents = Object.entries(previousFactors)
      .filter(([key]) => key !== 'color')
      .reduce((sum, [, value]) => sum + value, 0);

    const score = Math.min(baseComponents + colorComponent, 100);
    const level = this.scoreToLevel(score);

    const riskScore = this.riskScoreRepo.create({
      studentId,
      score,
      level,
      factors: { ...previousFactors, color: colorComponent },
    });
    await this.riskScoreRepo.save(riskScore);
    await this.studentRepo.update(studentId, { currentRiskScore: score });

    await this.maybeCreateRiskAlert(studentId, score, level);

    return riskScore;
  }

  private scoreToLevel(score: number): RiskLevel {
    if (score >= 70) return RiskLevel.DANGER;
    if (score >= 40) return RiskLevel.ATTENTION;
    return RiskLevel.NORMAL;
  }

  private async maybeCreateRiskAlert(
    studentId: string,
    score: number,
    level: RiskLevel,
  ) {
    if (level === RiskLevel.NORMAL) return;

    const previous = await this.riskScoreRepo.find({
      where: { studentId },
      order: { calculatedAt: 'DESC' },
      take: 2,
    });

    const previousScore = previous[1]?.score ?? 0;
    if (score <= previousScore) return;

    await this.alertRepo.save(
      this.alertRepo.create({
        studentId,
        type: AlertType.RISK_INCREASE,
        level,
        message:
          level === RiskLevel.DANGER
            ? `Risk darajasi ${score} ga oshdi (Xavfli)`
            : `Risk darajasi ${score} ga oshdi (E'tiborga muhtoj)`,
      }),
    );
  }

  private async maybeCreateMoodStreakAlert(
    studentId: string,
    recentMoods: MoodEntry[],
  ) {
    const lastThree = recentMoods.slice(0, 3);
    if (
      lastThree.length === 3 &&
      lastThree.every((m) => LOW_MOODS.includes(m.mood))
    ) {
      await this.alertRepo.save(
        this.alertRepo.create({
          studentId,
          type: AlertType.LOW_MOOD_STREAK,
          level: RiskLevel.ATTENTION,
          message: 'Oxirgi 3 kunda kayfiyat past darajada qayd etilgan',
        }),
      );
    }
  }

  async createTestResultAlertIfNeeded(
    studentId: string,
    riskPoints: number,
  ) {
    if (riskPoints >= 25) {
      await this.alertRepo.save(
        this.alertRepo.create({
          studentId,
          type: AlertType.TEST_RESULT,
          level: riskPoints >= 40 ? RiskLevel.DANGER : RiskLevel.ATTENTION,
          message: `Haftalik testda yuqori risk ko'rsatkichi qayd etildi (${riskPoints} ball)`,
        }),
      );
    }
  }

  async createChatFlagAlert(studentId: string, snippet: string) {
    await this.alertRepo.save(
      this.alertRepo.create({
        studentId,
        type: AlertType.CHAT_FLAG,
        level: RiskLevel.DANGER,
        message: `AI suhbatda xavotirli xabar aniqlandi: "${snippet}"`,
      }),
    );
  }

  async getHistory(studentId: string, days = 30): Promise<RiskScore[]> {
    return this.riskScoreRepo.find({
      where: { studentId },
      order: { calculatedAt: 'DESC' },
      take: days,
    });
  }
}

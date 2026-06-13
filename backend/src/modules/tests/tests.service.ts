import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, Test, TestResult } from '../../database/entities';
import { RiskService } from '../risk/risk.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { SubmitTestDto } from './dto/submit-test.dto';
import { QUESTIONS, TEST_TITLE, TEST_DESCRIPTION } from '../../database/seeds/questions.data';

@Injectable()
export class TestsService implements OnModuleInit {
  constructor(
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
    @InjectRepository(TestResult)
    private readonly resultRepo: Repository<TestResult>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly riskService: RiskService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  async onModuleInit(): Promise<void> {
    const test = await this.testRepo.findOne({ where: { title: TEST_TITLE } });
    if (test) {
      test.description = TEST_DESCRIPTION;
      test.questions = QUESTIONS;
      await this.testRepo.save(test);
    } else {
      await this.testRepo.save(
        this.testRepo.create({
          title: TEST_TITLE,
          description: TEST_DESCRIPTION,
          isActive: true,
          questions: QUESTIONS,
        }),
      );
    }
  }

  async findActive(): Promise<Test[]> {
    return this.testRepo.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Test> {
    const test = await this.testRepo.findOne({ where: { id } });
    if (!test) {
      throw new NotFoundException('Test topilmadi');
    }
    return test;
  }

  async submit(studentId: string, dto: SubmitTestDto): Promise<TestResult> {
    const test = await this.findOne(dto.testId);

    let correctCount = 0;
    let riskPoints = 0;
    const domainScores: Record<string, number> = {};

    for (const question of test.questions) {
      const answerKey = dto.answers[question.id];
      const option = question.options.find((o) => o.key === answerKey);
      if (option) {
        riskPoints += option.riskWeight;
        domainScores[question.domain] =
          (domainScores[question.domain] ?? 0) + option.riskWeight;
      }
      if (question.correctKey && answerKey === question.correctKey) {
        correctCount += 1;
      }
    }

    const totalCount = test.questions.length;
    const scorePercent = totalCount
      ? Math.round((correctCount / totalCount) * 100)
      : 0;

    const student = await this.studentRepo.findOne({ where: { id: studentId } });

    const aiResult = await this.aiAnalysisService.analyze(
      domainScores,
      student?.className ?? '',
    );

    const result = this.resultRepo.create({
      studentId,
      testId: test.id,
      answers: dto.answers,
      correctCount,
      totalCount,
      scorePercent,
      riskPoints,
      domainScores,
      aiRiskLevel: aiResult.level,
      aiInsight: aiResult.insight,
      aiRecommendation: aiResult.recommendation,
    });
    await this.resultRepo.save(result);

    await this.riskService.recalculateFromAi(studentId, aiResult.level);
    await this.riskService.createTestResultAlertIfNeeded(studentId, riskPoints);

    return result;
  }

  async getHistory(studentId: string): Promise<TestResult[]> {
    return this.resultRepo.find({
      where: { studentId },
      order: { completedAt: 'DESC' },
      relations: ['test'],
    });
  }
}

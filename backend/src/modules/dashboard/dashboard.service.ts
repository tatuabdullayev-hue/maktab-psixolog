import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Student,
  MoodEntry,
  TestResult,
  RiskScore,
  RiskLevel,
} from '../../database/entities';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(MoodEntry)
    private readonly moodRepo: Repository<MoodEntry>,
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
    @InjectRepository(RiskScore)
    private readonly riskScoreRepo: Repository<RiskScore>,
    private readonly alertsService: AlertsService,
  ) {}

  private levelOf(score: number): RiskLevel {
    if (score >= 70) return RiskLevel.DANGER;
    if (score >= 40) return RiskLevel.ATTENTION;
    return RiskLevel.NORMAL;
  }

  async overview() {
    const students = await this.studentRepo.find();
    const total = students.length;
    let normal = 0;
    let attention = 0;
    let danger = 0;

    for (const s of students) {
      const level = this.levelOf(s.currentRiskScore);
      if (level === RiskLevel.NORMAL) normal += 1;
      else if (level === RiskLevel.ATTENTION) attention += 1;
      else danger += 1;
    }

    return { total, normal, attention, danger };
  }

  async studentsList() {
    const students = await this.studentRepo.find({
      order: { currentRiskScore: 'DESC' },
    });

    return students.map((s) => ({
      id: s.id,
      fullName: [s.firstName, s.lastName].filter(Boolean).join(' '),
      className: s.className,
      riskScore: s.currentRiskScore,
      level: this.levelOf(s.currentRiskScore),
    }));
  }

  async studentDetail(id: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException('O\'quvchi topilmadi');
    }

    const [moodHistory, testResults, riskHistory, alerts] = await Promise.all([
      this.moodRepo.find({
        where: { studentId: id },
        order: { createdAt: 'DESC' },
        take: 30,
      }),
      this.testResultRepo.find({
        where: { studentId: id },
        order: { completedAt: 'DESC' },
        take: 10,
        relations: ['test'],
      }),
      this.riskScoreRepo.find({
        where: { studentId: id },
        order: { calculatedAt: 'DESC' },
        take: 30,
      }),
      this.alertsService.findForStudent(id),
    ]);

    return {
      student: {
        id: student.id,
        fullName: [student.firstName, student.lastName]
          .filter(Boolean)
          .join(' '),
        className: student.className,
        riskScore: student.currentRiskScore,
        level: this.levelOf(student.currentRiskScore),
      },
      moodHistory,
      testResults,
      riskHistory,
      alerts,
    };
  }

  /**
   * 2-qism (psixolog dashboardi) uchun: maktab/tuman/sana bo'yicha filtrlangan
   * web-test natijalari statistikasi (har bir TestResult = bitta o'quvchi sessiyasi).
   */
  async overviewFull(filters: { school?: string; district?: string; date?: string }) {
    const qb = this.testResultRepo
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.student', 'student')
      .where('tr.aiRiskLevel IS NOT NULL');

    if (filters.date) {
      qb.andWhere('DATE(tr.completedAt) = :date', { date: filters.date });
    }
    if (filters.school) {
      qb.andWhere('student.schoolName = :school', { school: filters.school });
    }
    if (filters.district) {
      qb.andWhere('student.district = :district', { district: filters.district });
    }

    const results = await qb.orderBy('tr.completedAt', 'DESC').getMany();

    const total = results.length;
    const counts = { normal: 0, attention: 0, danger: 0 };
    const classMap = new Map<string, { normal: number; attention: number; danger: number }>();

    for (const r of results) {
      const level = r.aiRiskLevel ?? RiskLevel.NORMAL;
      counts[level] += 1;

      const className = r.student?.className ?? "Noma'lum";
      if (!classMap.has(className)) {
        classMap.set(className, { normal: 0, attention: 0, danger: 0 });
      }
      classMap.get(className)![level] += 1;
    }

    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

    const highRiskStudents = results
      .filter((r) => r.aiRiskLevel === RiskLevel.DANGER)
      .map((r) => ({
        id: r.student?.id,
        fullName: [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' '),
        className: r.student?.className,
        level: r.aiRiskLevel,
        aiInsight: r.aiInsight,
        aiRecommendation: r.aiRecommendation,
        completedAt: r.completedAt,
      }));

    const classBreakdown = Array.from(classMap.entries())
      .map(([className, levels]) => ({ className, ...levels }))
      .sort((a, b) => a.className.localeCompare(b.className));

    const students = results.map((r) => ({
      id: r.student?.id,
      fullName: [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' '),
      className: r.student?.className,
      level: r.aiRiskLevel ?? RiskLevel.NORMAL,
      aiInsight: r.aiInsight,
      aiRecommendation: r.aiRecommendation,
      completedAt: r.completedAt,
    }));

    return {
      total,
      low: counts.normal,
      medium: counts.attention,
      high: counts.danger,
      lowPct: pct(counts.normal),
      mediumPct: pct(counts.attention),
      highPct: pct(counts.danger),
      classBreakdown,
      highRiskStudents,
      students,
    };
  }

  /**
   * Pastdagi "Trendlar" kartasi uchun: oxirgi 14 kun bo'yicha har kuni
   * topshirilgan testlar sonini va risk darajalari taqsimotini qaytaradi.
   */
  async trends(filters: { school?: string; district?: string }) {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const qb = this.testResultRepo
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.student', 'student')
      .where('tr.aiRiskLevel IS NOT NULL')
      .andWhere('tr.completedAt >= :since', { since });

    if (filters.school) {
      qb.andWhere('student.schoolName = :school', { school: filters.school });
    }
    if (filters.district) {
      qb.andWhere('student.district = :district', { district: filters.district });
    }

    const results = await qb.getMany();

    const days: {
      date: string;
      normal: number;
      attention: number;
      danger: number;
      total: number;
    }[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), normal: 0, attention: 0, danger: 0, total: 0 });
    }
    const byDate = new Map(days.map((d) => [d.date, d]));

    for (const r of results) {
      const key = new Date(r.completedAt).toISOString().slice(0, 10);
      const entry = byDate.get(key);
      if (!entry) continue;
      const level = r.aiRiskLevel ?? RiskLevel.NORMAL;
      entry[level] += 1;
      entry.total += 1;
    }

    return days;
  }

  async alerts(onlyUnresolved = true) {
    return this.alertsService.findAll(onlyUnresolved);
  }

  async resolveAlert(id: string) {
    return this.alertsService.resolve(id);
  }
}

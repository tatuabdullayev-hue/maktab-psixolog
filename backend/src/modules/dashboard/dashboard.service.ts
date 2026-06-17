import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  Student,
  MoodEntry,
  TestResult,
  RiskScore,
  RiskLevel,
} from '../../database/entities';
import { PsychologistNote } from '../../database/entities/psychologist-note.entity';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private anthropic: Anthropic | null;

  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(MoodEntry)
    private readonly moodRepo: Repository<MoodEntry>,
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
    @InjectRepository(RiskScore)
    private readonly riskScoreRepo: Repository<RiskScore>,
    @InjectRepository(PsychologistNote)
    private readonly noteRepo: Repository<PsychologistNote>,
    private readonly alertsService: AlertsService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  }

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

    // Yakunlangan (NAZORAT_CHIQISH) o'quvchilarni highRisk jadvalidan chiqaramiz
    const releasedRaw = await this.noteRepo
      .createQueryBuilder('n')
      .select('n.studentId', 'studentId')
      .addSelect('MAX(n.createdAt)', 'releasedAt')
      .where("n.note LIKE '[NAZORAT_CHIQISH]%'")
      .groupBy('n.studentId')
      .getRawMany();

    const releasedSet = new Set<string>();
    for (const r of releasedRaw) {
      // Chiqarilgan sanadan keyin yangi DANGER bo'lmasa — haqiqatan yakunlangan
      const newDanger = results.find(
        tr => tr.student?.id === r.studentId &&
        tr.aiRiskLevel === RiskLevel.DANGER &&
        new Date(tr.completedAt) > new Date(r.releasedAt)
      );
      if (!newDanger) releasedSet.add(r.studentId);
    }

    // Har o'quvchidan eng so'nggi DANGER natijasini olamiz (deduplicate)
    const dangerMap = new Map<string, typeof results[0]>();
    for (const r of results) {
      if (r.aiRiskLevel !== RiskLevel.DANGER) continue;
      const sid = r.student?.id;
      if (!sid || releasedSet.has(sid)) continue;
      if (!dangerMap.has(sid)) dangerMap.set(sid, r);
    }

    const highRiskStudents = Array.from(dangerMap.values()).map((r) => ({
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

  /**
   * 2 va undan ko'p marta DANGER darajasi aniqlangan o'quvchilar — "Ichki nazorat" guruhi.
   */
  async monitoredStudents(filters: { school?: string; district?: string }) {
    const qb = this.testResultRepo
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.student', 'student')
      .where('tr.aiRiskLevel = :level', { level: RiskLevel.DANGER });

    if (filters.school) {
      qb.andWhere('student.schoolName = :school', { school: filters.school });
    }
    if (filters.district) {
      qb.andWhere('student.district = :district', { district: filters.district });
    }

    const dangerResults = await qb.orderBy('tr.completedAt', 'DESC').getMany();

    // Nazoratdan chiqarilgan o'quvchilar — faqat chiqarilgan sanadan KEYIN yangi DANGER natija
    // bo'lmagan holda chiqarib tashlanadi
    const releasedRaw = await this.noteRepo
      .createQueryBuilder('n')
      .select('n.studentId', 'studentId')
      .addSelect('MAX(n.createdAt)', 'releasedAt')
      .where("n.note LIKE '[NAZORAT_CHIQISH]%'")
      .groupBy('n.studentId')
      .getRawMany();

    // Chiqarilgan sanadan keyin yangi DANGER natija bor bo'lsa — qaytadan kiritamiz
    const releasedIds = new Set<string>();
    for (const r of releasedRaw) {
      const newDanger = dangerResults.find(
        tr => tr.student?.id === r.studentId && new Date(tr.completedAt) > new Date(r.releasedAt)
      );
      if (!newDanger) releasedIds.add(r.studentId);
    }

    // O'quvchi bo'yicha guruhlaymiz
    const byStudent = new Map<string, typeof dangerResults>();
    for (const r of dangerResults) {
      const sid = r.student?.id;
      if (!sid) continue;
      if (!byStudent.has(sid)) byStudent.set(sid, []);
      byStudent.get(sid)!.push(r);
    }

    // Qo'lda qo'shilgan o'quvchilar ([NAZORAT_QOSHISH] note bor)
    const manualRaw = await this.noteRepo
      .createQueryBuilder('n')
      .select('n.studentId', 'studentId')
      .addSelect('MAX(n.createdAt)', 'createdAt')
      .where("n.note LIKE '[NAZORAT_QOSHISH]%'")
      .groupBy('n.studentId')
      .getRawMany();
    const manualIds = new Set(manualRaw.map((r: any) => r.studentId));

    // 2 va undan ko'p marta danger bo'lganlari YOKI qo'lda qo'shilganlar (chiqarilganlar bundan mustasno)
    const monitored: any[] = [];
    const addedSids = new Set<string>();

    for (const [sid, results] of byStudent) {
      if (releasedIds.has(sid)) continue;
      if (results.length < 2 && !manualIds.has(sid)) continue;
      addedSids.add(sid);
      const latest = results[0];
      monitored.push({
        id: latest.student?.id,
        fullName: [latest.student?.firstName, latest.student?.lastName].filter(Boolean).join(' '),
        className: latest.student?.className ?? '—',
        dangerCount: results.length,
        manuallyAdded: manualIds.has(sid),
        lastDetected: latest.completedAt,
        lastInsight: latest.aiInsight ?? null,
        lastRecommendation: latest.aiRecommendation ?? null,
        allInsights: results.map(r => ({
          date: r.completedAt,
          insight: r.aiInsight ?? null,
        })),
      });
    }

    // Qo'lda qo'shilgan lekin hech qanday test topshirmagan o'quvchilar
    const manualOnlyIds = [...manualIds].filter(sid => !addedSids.has(sid) && !releasedIds.has(sid));
    if (manualOnlyIds.length > 0) {
      const manualStudents = await this.studentRepo
        .createQueryBuilder('s')
        .where('s.id IN (:...ids)', { ids: manualOnlyIds })
        .getMany();
      for (const st of manualStudents) {
        const noteEntry = manualRaw.find((r: any) => r.studentId === st.id);
        monitored.push({
          id: st.id,
          fullName: [st.firstName, st.lastName].filter(Boolean).join(' '),
          className: st.className ?? '—',
          dangerCount: 0,
          manuallyAdded: true,
          lastDetected: noteEntry?.createdAt ?? new Date().toISOString(),
          lastInsight: null,
          lastRecommendation: null,
          allInsights: [],
        });
      }
    }

    return monitored.sort((a, b) => b.dangerCount - a.dangerCount);
  }

  async deleteStudent(id: string) {
    // Bog'liq barcha ma'lumotlarni tartib bilan o'chiramiz
    await this.noteRepo.delete({ studentId: id });
    await this.moodRepo.delete({ studentId: id });
    await this.testResultRepo.delete({ studentId: id });
    await this.riskScoreRepo.delete({ studentId: id });
    await this.studentRepo.delete(id);
    return { success: true };
  }

  async releasedCount(filters: { school?: string; district?: string }) {
    const qb = this.noteRepo
      .createQueryBuilder('n')
      .leftJoin(Student, 's', 's.id = n.studentId')
      .where("n.note LIKE '[NAZORAT_CHIQISH]%'");

    if (filters.school) qb.andWhere('s.schoolName = :school', { school: filters.school });
    if (filters.district) qb.andWhere('s.district = :district', { district: filters.district });

    const count = await qb.getCount();
    return { count };
  }

  async addToMonitor(dto: { firstName: string; lastName: string; className: string; reason?: string }) {
    // O'quvchini bazadan qidiramiz
    let student = await this.studentRepo.findOne({
      where: { firstName: dto.firstName, lastName: dto.lastName },
    });

    // Topilmasa yangi yaratamiz (class access tekshiruvisiz)
    if (!student) {
      student = this.studentRepo.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        className: dto.className,
        schoolName: '53-maktab',
        district: 'Chortoq tumani',
        currentRiskScore: 0,
      });
      await this.studentRepo.save(student);
    }

    // Nazoratga qo'shish notesi
    await this.noteRepo.save(
      this.noteRepo.create({
        studentId: student.id,
        type: 'other' as any,
        note: `[NAZORAT_QOSHISH] ${dto.reason?.trim() || "Psixolog tomonidan ichki nazoratga qo'shildi"}`,
        nextStep: "Muntazam kuzatuv va psixologik yordam ko'rsatish",
      }),
    );

    return { success: true, studentId: student.id };
  }

  async alerts(onlyUnresolved = true) {
    return this.alertsService.findAll(onlyUnresolved);
  }

  async resolveAlert(id: string) {
    return this.alertsService.resolve(id);
  }

  async schoolAdvice(filters: { school?: string; district?: string }): Promise<{ advice: string }> {
    const ov = await this.overviewFull(filters);

    const dangerPct  = ov.total ? Math.round((ov.high / ov.total) * 100) : 0;
    const topClasses = [...ov.classBreakdown]
      .sort((a, b) => b.danger - a.danger)
      .slice(0, 3)
      .filter(c => c.danger > 0)
      .map(c => `${c.className} (${c.danger} ta yuqori xavf)`)
      .join(', ');

    const prompt = `Maktab psixologik holati statistikasi:
- Jami test topshirgan o'quvchi: ${ov.total} ta
- Yuqori xavf (DANGER): ${ov.high} ta (${dangerPct}%)
- O'rta xavf (ATTENTION): ${ov.medium} ta (${ov.mediumPct}%)
- Past xavf (NORMAL): ${ov.low} ta (${ov.lowPct}%)
- Eng ko'p yuqori xavfli sinflar: ${topClasses || 'yo\'q'}
- Maktab: ${filters.school || '53-maktab'}, ${filters.district || 'Chortoq tumani'}

Ushbu ma'lumotlar asosida maktab psixologi uchun 3-5 ta aniq, amaliy tavsiya ber.
Tavsiyalar O'zbekiston maktabi sharoitiga mos, qisqa va aniq bo'lsin.
Faqat tavsiyalar ro'yxatini qaytar (markdown bullet points), boshqa matn yozma.`;

    if (this.anthropic) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = response.content.find(b => b.type === 'text');
        if (textBlock && 'text' in textBlock) {
          return { advice: textBlock.text };
        }
      } catch (e) {
        this.logger.warn(`AI tavsiya xatosi, fallback: ${e.message}`);
      }
    }

    // Fallback — qoida asosida
    const lines: string[] = [];
    if (ov.high > 0) {
      lines.push(`• Yuqori xavf guruhidagi ${ov.high} ta o'quvchi bilan tezkor individual suhbat o'tkazish tavsiya etiladi.`);
    }
    if (dangerPct >= 20) {
      lines.push(`• Yuqori xavf ko'rsatkichi ${dangerPct}% ga yetgan — sinf rahbarlari bilan umumiy uchrashuv o'tkazish zarur.`);
    }
    if (topClasses) {
      lines.push(`• ${topClasses} sinflarida guruhiy psixologik mashg'ulotlar tashkil etish maqsadga muvofiq.`);
    }
    if (ov.medium > 0) {
      lines.push(`• O'rta xavf guruhidagi ${ov.medium} ta o'quvchini muntazam kuzatuvda ushlab turish lozim.`);
    }
    lines.push(`• Ota-onalar bilan hamkorlikni kuchaytirish uchun ota-onalar yig'ilishida psixologik ma'ruza o'tkazish tavsiya etiladi.`);
    return { advice: lines.join('\n') };
  }
}

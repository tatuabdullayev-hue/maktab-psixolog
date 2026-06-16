import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { WordReportService } from './word-report.service';
import { NotesService } from '../notes/notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly wordReportService: WordReportService,
    private readonly notesService: NotesService,
  ) {}

  @Get('overview')
  overview(
    @Query('school') school?: string,
    @Query('district') district?: string,
    @Query('date') date?: string,
  ) {
    return this.dashboardService.overviewFull({ school, district, date });
  }

  @Get('trends')
  trends(
    @Query('school') school?: string,
    @Query('district') district?: string,
  ) {
    return this.dashboardService.trends({ school, district });
  }

  @Get('students')
  students() {
    return this.dashboardService.studentsList();
  }

  @Get('students/:id')
  studentDetail(@Param('id') id: string) {
    return this.dashboardService.studentDetail(id);
  }

  @Delete('students/:id')
  deleteStudent(@Param('id') id: string) {
    return this.dashboardService.deleteStudent(id);
  }

  @Get('alerts')
  alerts(@Query('all') all?: string) {
    return this.dashboardService.alerts(all !== 'true');
  }

  @Patch('alerts/:id/resolve')
  resolveAlert(@Param('id') id: string) {
    return this.dashboardService.resolveAlert(id);
  }

  @Post('add-to-monitor')
  addToMonitor(@Body() body: { firstName: string; lastName: string; className: string; reason?: string }) {
    return this.dashboardService.addToMonitor(body);
  }

  @Get('released-count')
  releasedCount(
    @Query('school') school?: string,
    @Query('district') district?: string,
  ) {
    return this.dashboardService.releasedCount({ school, district });
  }

  @Get('monitored')
  monitored(
    @Query('school') school?: string,
    @Query('district') district?: string,
  ) {
    return this.dashboardService.monitoredStudents({ school, district });
  }

  @Get('word-report')
  async wordReport(
    @Query('school') school: string,
    @Query('district') district: string,
    @Res() res: Response,
  ) {
    const [overview, notes] = await Promise.all([
      this.dashboardService.overviewFull({ school, district }),
      this.notesService.getAll(school, district),
    ]);

    const dangerStudents = overview.students.filter((s) => s.level === 'danger');
    const attentionStudents = overview.students.filter((s) => s.level === 'attention');
    const normalStudents = overview.students.filter((s) => s.level === 'normal');

    const buffer = await this.wordReportService.generate({
      school: school || '53-maktab',
      district: district || 'Chortoq tumani',
      total: overview.total,
      danger: dangerStudents.length,
      attention: attentionStudents.length,
      normal: normalStudents.length,
      students: overview.students.map((s) => ({
        fullName: s.fullName,
        className: s.className,
        level: String(s.level),
        aiInsight: s.aiInsight ?? null,
        completedAt: String(s.completedAt),
      })),
      notes: (notes as any[]).map((n) => ({
        studentId: n.studentId,
        type: n.type,
        note: n.note,
        nextStep: n.nextStep,
        createdAt: n.createdAt,
        student: n.student ?? null,
      })),
    });

    const today = new Date().toISOString().slice(0, 10);
    const filename = `Hisobot_${(school || '53-maktab').replace(/\s/g, '_')}_${today}.docx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}

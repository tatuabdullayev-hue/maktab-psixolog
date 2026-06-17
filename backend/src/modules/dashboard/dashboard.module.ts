import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  Student,
  MoodEntry,
  TestResult,
  RiskScore,
} from '../../database/entities';
import { PsychologistNote } from '../../database/entities/psychologist-note.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WordReportService } from './word-report.service';
import { AlertsModule } from '../alerts/alerts.module';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, MoodEntry, TestResult, RiskScore, PsychologistNote]),
    ConfigModule,
    AlertsModule,
    NotesModule,
  ],
  providers: [DashboardService, WordReportService],
  controllers: [DashboardController],
})
export class DashboardModule {}

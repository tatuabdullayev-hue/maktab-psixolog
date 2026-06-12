import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Student,
  MoodEntry,
  TestResult,
  RiskScore,
} from '../../database/entities';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, MoodEntry, TestResult, RiskScore]),
    AlertsModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}

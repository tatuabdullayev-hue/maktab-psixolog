import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  RiskScore,
  Alert,
  MoodEntry,
  TestResult,
  Student,
} from '../../database/entities';
import { RiskService } from './risk.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskScore, Alert, MoodEntry, TestResult, Student]),
  ],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}

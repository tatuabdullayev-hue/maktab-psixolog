import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student, Test, TestResult } from '../../database/entities';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { RiskModule } from '../risk/risk.module';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Test, TestResult, Student]),
    RiskModule,
    AiAnalysisModule,
  ],
  providers: [TestsService],
  controllers: [TestsController],
  exports: [TestsService],
})
export class TestsModule {}

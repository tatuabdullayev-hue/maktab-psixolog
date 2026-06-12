import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodEntry } from '../../database/entities';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [TypeOrmModule.forFeature([MoodEntry]), RiskModule],
  providers: [MoodService],
  controllers: [MoodController],
  exports: [MoodService],
})
export class MoodModule {}

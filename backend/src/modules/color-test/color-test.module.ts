import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorTestResult } from '../../database/entities';
import { ColorTestService } from './color-test.service';
import { ColorTestController } from './color-test.controller';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [TypeOrmModule.forFeature([ColorTestResult]), RiskModule],
  providers: [ColorTestService],
  controllers: [ColorTestController],
})
export class ColorTestModule {}

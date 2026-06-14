import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LifeChoicesResult } from '../../database/entities';
import { LifeChoicesService } from './life-choices.service';
import { LifeChoicesController } from './life-choices.controller';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [TypeOrmModule.forFeature([LifeChoicesResult]), RiskModule],
  providers: [LifeChoicesService],
  controllers: [LifeChoicesController],
})
export class LifeChoicesModule {}

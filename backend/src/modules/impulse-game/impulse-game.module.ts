import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImpulseGameResult } from '../../database/entities';
import { ImpulseGameService } from './impulse-game.service';
import { ImpulseGameController } from './impulse-game.controller';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [TypeOrmModule.forFeature([ImpulseGameResult]), RiskModule],
  providers: [ImpulseGameService],
  controllers: [ImpulseGameController],
})
export class ImpulseGameModule {}

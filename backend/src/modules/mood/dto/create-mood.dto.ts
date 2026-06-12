import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MoodLevel } from '../../../database/entities';

export class CreateMoodDto {
  @IsEnum(MoodLevel)
  mood: MoodLevel;

  @IsOptional()
  @IsString()
  note?: string;
}

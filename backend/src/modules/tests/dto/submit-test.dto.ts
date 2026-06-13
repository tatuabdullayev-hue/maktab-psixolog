import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { MoodLevel } from '../../../database/entities';

export class SubmitTestDto {
  @IsString()
  @IsNotEmpty()
  testId: string;

  @IsObject()
  answers: Record<string, string>;

  @IsOptional()
  @IsEnum(MoodLevel)
  mood?: MoodLevel;
}

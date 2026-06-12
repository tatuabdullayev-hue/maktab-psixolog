import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SubmitTestDto {
  @IsString()
  @IsNotEmpty()
  testId: string;

  @IsObject()
  answers: Record<string, string>;
}

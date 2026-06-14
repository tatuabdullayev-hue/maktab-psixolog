import { ArrayMinSize, ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class SubmitColorTestDto {
  @IsArray()
  @ArrayMinSize(8)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  order: string[];
}

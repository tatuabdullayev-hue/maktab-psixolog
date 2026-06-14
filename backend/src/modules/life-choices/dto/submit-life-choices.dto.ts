import { ArrayMinSize, ArrayMaxSize, IsArray, IsIn } from 'class-validator';

export class SubmitLifeChoicesDto {
  @IsArray()
  @ArrayMinSize(8)
  @ArrayMaxSize(8)
  @IsIn(['a', 'b'], { each: true })
  answers: string[];
}

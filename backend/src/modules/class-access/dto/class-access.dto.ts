import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SetClassAccessDto {
  @IsString()
  @IsNotEmpty()
  className: string;

  @IsBoolean()
  isActive: boolean;
}

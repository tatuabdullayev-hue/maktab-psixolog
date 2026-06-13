import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class TelegramAuthDto {
  @IsString()
  @IsNotEmpty()
  initData: string;
}

export class RegisterStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  className: string;

  @IsInt()
  @Min(10)
  @Max(20)
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  schoolName?: string;

  @IsString()
  @IsOptional()
  district?: string;
}

export class PsychologistLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsString()
  @IsNotEmpty()
  district: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class RegisterPsychologistDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsString()
  @IsNotEmpty()
  district: string;
}

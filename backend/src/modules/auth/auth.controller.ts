import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  TelegramAuthDto,
  PsychologistLoginDto,
  RegisterStudentDto,
  RegisterPsychologistDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  loginWithTelegram(@Body() dto: TelegramAuthDto) {
    return this.authService.loginWithTelegram(dto.initData);
  }

  @Post('login')
  loginPsychologist(@Body() dto: PsychologistLoginDto) {
    return this.authService.loginPsychologist(dto.username, dto.password);
  }

  /** Psixolog o'zi uchun kabinet ochadi (maktab/tuman bilan). */
  @Post('register-psychologist')
  registerPsychologist(@Body() dto: RegisterPsychologistDto) {
    return this.authService.registerPsychologist(dto);
  }

  /** O'quvchi web-sahifa orqali ism/familiya/sinf kiritib boshlaydi (1-qism). */
  @Post('register')
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerWebStudent(dto);
  }

  /** Dev-only: login without Telegram, for local browser testing of the Mini App. */
  @Post('dev-login')
  loginDev(@Body() body: { telegramId: string; firstName: string }) {
    return this.authService.loginDev(body.telegramId, body.firstName);
  }
}

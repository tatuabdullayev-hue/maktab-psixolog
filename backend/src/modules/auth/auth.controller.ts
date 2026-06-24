import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  TelegramAuthDto,
  PsychologistLoginDto,
  RegisterStudentDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  loginWithTelegram(@Body() dto: TelegramAuthDto) {
    return this.authService.loginWithTelegram(dto.initData);
  }

  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('login')
  loginPsychologist(@Body() dto: PsychologistLoginDto) {
    return this.authService.loginPsychologist(dto.username, dto.password);
  }

  /** O'quvchi web-sahifa orqali ism/familiya/sinf kiritib boshlaydi (1-qism). */
  @Post('register')
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerWebStudent(dto);
  }

  /** Dev-only: login without Telegram, for local browser testing of the Mini App. */
  @Post('dev-login')
  loginDev(@Body() body: { telegramId: string; firstName: string }) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Not available');
    }
    return this.authService.loginDev(body.telegramId, body.firstName);
  }

}

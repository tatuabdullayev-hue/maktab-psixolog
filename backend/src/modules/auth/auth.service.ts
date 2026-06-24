import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../database/entities';
import { StudentsService } from '../students/students.service';
import { ClassAccessService } from '../class-access/class-access.service';
import { validateTelegramInitData } from './telegram-init-data.util';
import { RegisterStudentDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly classAccessService: ClassAccessService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithTelegram(initData: string) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    let parsed;
    try {
      parsed = validateTelegramInitData(initData, botToken);
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }

    const student = await this.studentsService.findOrCreateByTelegram(
      parsed.user,
    );

    const token = this.jwtService.sign({ sub: student.id, type: 'student' });
    return { accessToken: token, student };
  }

  /** Dev-only: login without Telegram, for local browser testing of the Mini App. */
  async loginDev(telegramId: string, firstName: string) {
    const student = await this.studentsService.findOrCreateByTelegram({
      id: Number(telegramId),
      first_name: firstName,
    });
    const token = this.jwtService.sign({ sub: student.id, type: 'student' });
    return { accessToken: token, student };
  }

  /** Web (Telegram'siz) o'quvchi ro'yxatdan o'tishi - 1-qism kirish formasi. */
  async registerWebStudent(dto: RegisterStudentDto) {
    const isActive = await this.classAccessService.isClassActive(dto.className);
    if (!isActive) {
      throw new ForbiddenException('Hozircha mashg\'ulot faol emas');
    }

    const student = await this.studentsService.createWebStudent(dto);
    const token = this.jwtService.sign({ sub: student.id, type: 'student' });
    return { accessToken: token, student };
  }

  /** Faqat bitta qattiq belgilangan login/parol bilan kirish ruxsat etiladi. */
  private static readonly FIXED_USERNAME = 'Chortoq2026';
  private static readonly FIXED_PASSWORD = 'Chortoq2026';

  async loginPsychologist(username: string, password: string) {
    if (
      username !== AuthService.FIXED_USERNAME ||
      password !== AuthService.FIXED_PASSWORD
    ) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    const token = this.jwtService.sign({
      sub: 'chortoq-2026',
      type: UserRole.PSYCHOLOGIST,
    });
    return {
      accessToken: token,
      user: {
        id: 'chortoq-2026',
        fullName: 'Chortoq tumani psixolog',
        role: UserRole.PSYCHOLOGIST,
        schoolName: '53-maktab',
        district: 'Chortoq tumani',
      },
    };
  }

}

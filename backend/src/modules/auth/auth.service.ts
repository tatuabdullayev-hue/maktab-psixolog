import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Psychologist, UserRole } from '../../database/entities';
import { StudentsService } from '../students/students.service';
import { validateTelegramInitData } from './telegram-init-data.util';
import {
  RegisterStudentDto,
  RegisterPsychologistDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Psychologist)
    private readonly psychologistRepo: Repository<Psychologist>,
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
    const student = await this.studentsService.createWebStudent(dto);
    const token = this.jwtService.sign({ sub: student.id, type: 'student' });
    return { accessToken: token, student };
  }

  async loginPsychologist(username: string, password: string) {
    const user = await this.psychologistRepo.findOne({ where: { username } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    const token = this.jwtService.sign({ sub: user.id, type: user.role });
    return {
      accessToken: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        schoolName: user.schoolName,
        district: user.district,
      },
    };
  }

  /** Psixolog o'zi uchun yangi kabinet ochadi (maktab/tuman bilan). */
  async registerPsychologist(dto: RegisterPsychologistDto) {
    const existing = await this.psychologistRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('Bu login allaqachon band');
    }

    const user = await this.psychologistRepo.save(
      this.psychologistRepo.create({
        fullName: dto.fullName,
        username: dto.username,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: UserRole.PSYCHOLOGIST,
        schoolName: dto.schoolName,
        district: dto.district,
      }),
    );

    const token = this.jwtService.sign({ sub: user.id, type: user.role });
    return {
      accessToken: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        schoolName: user.schoolName,
        district: user.district,
      },
    };
  }

  /** Profil ma'lumotlarini (ism, maktab, tuman) yangilash. */
  async updateProfile(psychologistId: string, dto: UpdateProfileDto) {
    const user = await this.psychologistRepo.findOne({
      where: { id: psychologistId },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    user.fullName = dto.fullName;
    user.schoolName = dto.schoolName;
    user.district = dto.district;
    await this.psychologistRepo.save(user);

    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      schoolName: user.schoolName,
      district: user.district,
    };
  }

  /** Parolni almashtirish. */
  async changePassword(psychologistId: string, dto: ChangePasswordDto) {
    const user = await this.psychologistRepo.findOne({
      where: { id: psychologistId },
    });
    if (!user || !user.passwordHash) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException("Joriy parol noto'g'ri");
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.psychologistRepo.save(user);

    return { success: true };
  }
}

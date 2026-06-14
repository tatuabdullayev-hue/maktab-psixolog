import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { ColorTestService } from './color-test.service';
import { SubmitColorTestDto } from './dto/submit-color-test.dto';

@UseGuards(JwtAuthGuard)
@Controller('color-test')
export class ColorTestController {
  constructor(private readonly colorTestService: ColorTestService) {}

  @Post('submit')
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitColorTestDto) {
    return this.colorTestService.submit(user.studentId, dto);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { LifeChoicesService } from './life-choices.service';
import { SubmitLifeChoicesDto } from './dto/submit-life-choices.dto';

@UseGuards(JwtAuthGuard)
@Controller('life-choices')
export class LifeChoicesController {
  constructor(private readonly lifeChoicesService: LifeChoicesService) {}

  @Post('submit')
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitLifeChoicesDto) {
    return this.lifeChoicesService.submit(user.studentId, dto);
  }
}

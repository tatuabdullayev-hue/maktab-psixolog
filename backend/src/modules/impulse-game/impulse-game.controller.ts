import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { ImpulseGameService } from './impulse-game.service';
import { SubmitImpulseGameDto } from './dto/submit-impulse-game.dto';

@UseGuards(JwtAuthGuard)
@Controller('impulse-game')
export class ImpulseGameController {
  constructor(private readonly impulseGameService: ImpulseGameService) {}

  @Post('submit')
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitImpulseGameDto) {
    return this.impulseGameService.submit(user.studentId, dto);
  }
}

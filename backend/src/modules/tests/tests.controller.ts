import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TestsService } from './tests.service';
import { SubmitTestDto } from './dto/submit-test.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  findActive() {
    return this.testsService.findActive();
  }

  @Get('results')
  history(@CurrentUser() user: AuthUser) {
    return this.testsService.getHistory(user.studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }

  @Post('submit')
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitTestDto) {
    return this.testsService.submit(user.studentId, dto);
  }
}

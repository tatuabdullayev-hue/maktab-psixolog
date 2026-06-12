import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { MoodService } from './mood.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('mood')
export class MoodController {
  constructor(private readonly moodService: MoodService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMoodDto) {
    return this.moodService.create(user.studentId, dto);
  }

  @Get()
  history(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    return this.moodService.getHistory(
      user.studentId,
      days ? parseInt(days, 10) : undefined,
    );
  }
}

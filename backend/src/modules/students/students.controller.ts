import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.studentsService.findOne(user.studentId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: { className?: string },
  ) {
    return this.studentsService.updateProfile(user.studentId, body);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }
}

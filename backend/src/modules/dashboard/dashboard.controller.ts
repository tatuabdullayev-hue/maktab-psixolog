import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  overview(
    @Query('school') school?: string,
    @Query('district') district?: string,
    @Query('date') date?: string,
  ) {
    return this.dashboardService.overviewFull({ school, district, date });
  }

  @Get('trends')
  trends(
    @Query('school') school?: string,
    @Query('district') district?: string,
  ) {
    return this.dashboardService.trends({ school, district });
  }

  @Get('students')
  students() {
    return this.dashboardService.studentsList();
  }

  @Get('students/:id')
  studentDetail(@Param('id') id: string) {
    return this.dashboardService.studentDetail(id);
  }

  @Get('alerts')
  alerts(@Query('all') all?: string) {
    return this.dashboardService.alerts(all !== 'true');
  }

  @Patch('alerts/:id/resolve')
  resolveAlert(@Param('id') id: string) {
    return this.dashboardService.resolveAlert(id);
  }
}

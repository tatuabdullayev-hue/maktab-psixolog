import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ClassAccessService } from './class-access.service';
import { SetClassAccessDto } from './dto/class-access.dto';

@Controller('class-access')
export class ClassAccessController {
  constructor(private readonly classAccessService: ClassAccessService) {}

  /** Ochiq endpoint: o'quvchi ro'yxatdan o'tish formasi uchun faol sinflar ro'yxati. */
  @Get('active')
  async getActiveClasses() {
    const classes = await this.classAccessService.getAll();
    return classes.filter((c) => c.isActive).map((c) => c.className);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @Get()
  getAll() {
    return this.classAccessService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @Patch()
  setActive(@Body() dto: SetClassAccessDto) {
    return this.classAccessService.setActive(dto.className, dto.isActive);
  }
}

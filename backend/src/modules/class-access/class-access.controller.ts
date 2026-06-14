import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ClassAccessService } from './class-access.service';
import { SetClassAccessDto } from './dto/class-access.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('class-access')
export class ClassAccessController {
  constructor(private readonly classAccessService: ClassAccessService) {}

  @Get()
  getAll() {
    return this.classAccessService.getAll();
  }

  @Patch()
  setActive(@Body() dto: SetClassAccessDto) {
    return this.classAccessService.setActive(dto.className, dto.isActive);
  }
}

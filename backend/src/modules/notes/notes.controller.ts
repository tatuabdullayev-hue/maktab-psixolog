import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { NoteType } from '../../database/entities/psychologist-note.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(
    @Body()
    body: {
      studentId: string;
      type: NoteType;
      note: string;
      nextStep?: string;
    },
  ) {
    return this.notesService.create(body);
  }

  @Get()
  getAll(
    @Query('studentId') studentId?: string,
    @Query('school') school?: string,
    @Query('district') district?: string,
  ) {
    if (studentId) return this.notesService.getByStudent(studentId);
    return this.notesService.getAll(school, district);
  }

  @Get('unattended-count')
  unattendedCount(
    @Query('school') school?: string,
    @Query('district') district?: string,
  ) {
    return this.notesService.unattendedCount(school, district).then(count => ({ count }));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notesService.delete(id);
  }
}

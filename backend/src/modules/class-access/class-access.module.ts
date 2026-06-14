import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassAccess } from '../../database/entities';
import { ClassAccessService } from './class-access.service';
import { ClassAccessController } from './class-access.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassAccess])],
  providers: [ClassAccessService],
  controllers: [ClassAccessController],
  exports: [ClassAccessService],
})
export class ClassAccessModule {}

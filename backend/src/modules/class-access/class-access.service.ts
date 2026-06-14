import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassAccess } from '../../database/entities';

const GRADES = [7, 8, 9, 10, 11];
const SECTIONS = ['A', 'B', 'C', 'D'];

export const ALL_CLASS_NAMES = GRADES.flatMap((grade) =>
  SECTIONS.map((section) => `${grade}-${section}`),
);

@Injectable()
export class ClassAccessService {
  constructor(
    @InjectRepository(ClassAccess)
    private readonly classAccessRepo: Repository<ClassAccess>,
  ) {}

  /** Barcha sinflar (7-A ... 11-D) ro'yxati, har biri faollik holati bilan. */
  async getAll(): Promise<{ className: string; isActive: boolean }[]> {
    const rows = await this.classAccessRepo.find();
    const activeMap = new Map(rows.map((row) => [row.className, row.isActive]));

    return ALL_CLASS_NAMES.map((className) => ({
      className,
      isActive: activeMap.get(className) ?? false,
    }));
  }

  /** Sinf uchun mashg'ulotga ruhsatni yoqish/o'chirish. */
  async setActive(className: string, isActive: boolean): Promise<{ className: string; isActive: boolean }> {
    let row = await this.classAccessRepo.findOne({ where: { className } });
    if (!row) {
      row = this.classAccessRepo.create({ className });
    }
    row.isActive = isActive;
    await this.classAccessRepo.save(row);
    return { className: row.className, isActive: row.isActive };
  }

  /** O'quvchi ro'yxatdan o'tishi uchun sinfga ruhsat berilganmi, tekshiradi. */
  async isClassActive(className: string): Promise<boolean> {
    const row = await this.classAccessRepo.findOne({ where: { className } });
    return row?.isActive ?? false;
  }
}

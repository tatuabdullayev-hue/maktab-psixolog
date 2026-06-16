import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALL_ENTITIES } from './database/entities/entities.list';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { MoodModule } from './modules/mood/mood.module';
import { TestsModule } from './modules/tests/tests.module';
import { ChatModule } from './modules/chat/chat.module';
import { RiskModule } from './modules/risk/risk.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { ClassAccessModule } from './modules/class-access/class-access.module';
import { NotesModule } from './modules/notes/notes.module';
import { ImpulseGameModule } from './modules/impulse-game/impulse-game.module';
import { ColorTestModule } from './modules/color-test/color-test.module';
import { LifeChoicesModule } from './modules/life-choices/life-choices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5433),
        username: config.get<string>('DB_USERNAME', 'psixolog'),
        password: config.get<string>('DB_PASSWORD', 'psixolog2024'),
        database: config.get<string>('DB_DATABASE', 'maktab_psixolog_db'),
        entities: ALL_ENTITIES,
        synchronize: true,
      }),
    }),
    AuthModule,
    StudentsModule,
    MoodModule,
    TestsModule,
    ChatModule,
    RiskModule,
    AlertsModule,
    DashboardModule,
    TelegramModule,
    ClassAccessModule,
    NotesModule,
    ImpulseGameModule,
    ColorTestModule,
    LifeChoicesModule,
  ],
})
export class AppModule {}

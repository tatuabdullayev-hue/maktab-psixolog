import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const miniAppUrl = this.configService.get<string>('TELEGRAM_MINI_APP_URL');

    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN berilmagan — bot ishga tushirilmadi',
      );
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });

    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;

      if (!miniAppUrl) {
        this.bot.sendMessage(
          chatId,
          'Salom! Maktab Psixolog Tizimiga xush kelibsiz.',
        );
        return;
      }

      this.bot.sendMessage(
        chatId,
        `Salom, ${msg.from?.first_name || ''}! Bugungi holatingni baham ko'rish, test ishlash va AI mentor bilan suhbatlashish uchun pastdagi tugmani bosing.`,
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: 'Ilovani ochish',
                  web_app: { url: miniAppUrl },
                },
              ],
            ],
            resize_keyboard: true,
          },
        },
      );
    });

    this.logger.log('Telegram bot ishga tushdi (polling)');
  }
}

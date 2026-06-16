import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, ChatRole } from '../../database/entities';
import { RiskService } from '../risk/risk.service';
import { containsRiskKeyword } from './risk-keywords';

const SYSTEM_PROMPT = `Sen maktab o'quvchilari uchun do'stona AI mentor san. Vazifang:
- O'quvchini diqqat bilan tinglash, hissiyotlarini tan olish va tushunish
- Iliq, sodda va yoshiga mos tilda gaplashish (o'zbek tilida)
- Hech qachon tibbiy yoki psixologik tashxis qo'ymaslik
- Agar o'quvchi o'ziga yoki boshqalarga zarar yetkazish haqida gapirsa, uni darhol kattalar (ota-ona, maktab psixologi)ga murojaat qilishga yo'naltirish va g'amxo'rlik bilan javob berish
- Javoblar qisqa va qo'llab-quvvatlovchi bo'lsin (2-4 jumla)`;

const FALLBACK_REPLIES = [
  "Tushundim, bu haqida ko'proq aytib bering. Sizni tinglayapman.",
  "Sizning his-tuyg'ularingiz juda muhim. Psixolog bilan gaplashishni tavsiya qilaman — u yordam bera oladi.",
  "Bu vaziyat og'ir bo'lishi mumkin. Maktab psixologiga murojaat qilishingiz yaxshi bo'lardi.",
  "Siz yolg'iz emasiz. Maktab psixologi yoki ota-onangiz bilan bu haqida gaplashing.",
  "Tushunaman. Bunday paytlarda yaqinlaringizga suyaning va psixolog bilan maslahatlashing.",
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private anthropic: Anthropic | null;

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    private readonly riskService: RiskService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async getHistory(studentId: string): Promise<ChatMessage[]> {
    return this.chatRepo.find({
      where: { studentId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(studentId: string, content: string): Promise<ChatMessage> {
    const flagged = containsRiskKeyword(content);

    const userMessage = this.chatRepo.create({
      studentId,
      role: ChatRole.USER,
      content,
      flagged,
    });
    await this.chatRepo.save(userMessage);

    if (flagged) {
      await this.riskService.createChatFlagAlert(
        studentId,
        content.slice(0, 120),
      );
      await this.riskService.recalculate(studentId);
    }

    const replyText = await this.generateReply(studentId);

    const assistantMessage = this.chatRepo.create({
      studentId,
      role: ChatRole.ASSISTANT,
      content: replyText,
    });
    await this.chatRepo.save(assistantMessage);

    return assistantMessage;
  }

  private async generateReply(studentId: string): Promise<string> {
    const history = await this.chatRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const ordered = history.reverse();

    if (!this.anthropic) {
      return this.fallbackReply();
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: ordered.map((m) => ({
          role: m.role === ChatRole.USER ? 'user' : 'assistant',
          content: m.content,
        })),
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock && 'text' in textBlock
        ? textBlock.text
        : this.fallbackReply();
    } catch (e) {
      this.logger.warn(`Claude chat xatosi, fallback ishlatiladi: ${e?.message}`);
      return this.fallbackReply();
    }
  }

  private fallbackReply(): string {
    return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
  }
}

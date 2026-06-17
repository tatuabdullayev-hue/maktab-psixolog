import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { RiskLevel } from '../../database/entities';

export interface StudentType {
  emoji: string;
  title: string;
  desc: string;
}

export interface AiAnalysisResult {
  level: RiskLevel;
  insight: string;
  recommendation: string;
  studentMessage: string;
  studentType: StudentType;
}

const DOMAIN_LABELS: Record<string, string> = {
  aggression: 'Agressivlik',
  bullying: "Bezorilik/qurbon bo'lish",
  emotional: "Hissiy holat (xavotir, qayg'u)",
  peer: 'Tengdoshlar bilan munosabat',
  conduct: "O'zini tutish/qoidabuzarlik",
  substance: 'Zararli odatlarga moyillik',
  prosocial: "Ijtimoiy ko'nikmalar yetishmovchiligi",
};

const DOMAIN_INSIGHTS: Record<string, string> = {
  aggression: 'Konfliktli vaziyatlarda agressiv reaksiyaga moyillik kuzatildi',
  bullying: "Bezorilik yoki uning qurboni bo'lish bilan bog'liq xavotirli javoblar aniqlandi",
  emotional: "Hissiy holatda xavotir, g'amginlik yoki o'ziga ishonchsizlik belgilari bor",
  peer: "Tengdoshlar bilan munosabatda yolg'izlanish yoki ziddiyat belgilari mavjud",
  conduct: "Qoidabuzarlik va ijtimoiy normalarga zid xatti-harakatlarga moyillik bor",
  substance: 'Zararli odatlarga (chekish, ichkilik va h.k.) nisbatan xavfli munosabat aniqlandi',
  prosocial: "Yordam so'rash va do'stona munosabatda qiyinchiliklar kuzatildi",
};

const SYSTEM_PROMPT = `Sen O'zbekiston maktablarida ishlaydigan bolalar va o'smirlar psixologiyasi bo'yicha mutaxassis tahlilchisan.

MUHIM QOIDALAR — BUZSIZ BAJAR:
1. Faqat berilgan domen ballari asosida tahlil qil. Ballar ko'rsatmagan narsa haqida hech narsa yozma, taxmin qilma, qo'shma.
2. O'zingdan hech qanday fikr, misol, izoh, kengaytirma qo'shma — faqat raqamlar nima desa, shuni yoz.
3. Madaniy kontekst: O'zbekiston, davlat maktabi, 7–11 sinf o'quvchisi. Tavsiyalar shu muhitga mos bo'lsin.
4. Til: faqat o'zbek tilida (lotin yozuvi), hech qanday rus yoki ingliz so'z qo'shma.
5. Faqat JSON qaytar — boshqa hech qanday matn, izoh, kirish so'zi yozma.

Berilgan ma'lumot: har bir psixologik domen bo'yicha risk bali (SDQ, Olweus, Buss-Perry metodikalari asosida). 0 = muammo yo'q, yuqori ball = muammo ehtimoli yuqori.

Qaytariladigan format (faqat shu, hech narsa qo'shma):
{
  "level": "normal" | "attention" | "danger",
  "insight": "1 ta qisqa jumla — faqat ballar ko'rsatgan asosiy muammo",
  "recommendation": "1-2 jumla — O'zbekiston maktabi psixologi uchun aniq amaliy qadam",
  "studentMessage": "",
  "studentType": {
    "emoji": "bitta emoji — bolaning xarakterini ifodalovchi",
    "title": "2-3 so'z — bolaning ijobiy 'turi' (masalan: Kuchli ruh, Sezgir ijodkor, Do'stsevar)",
    "desc": "1 ta gap — shu turning nima uchun kuch ekanligini bolaga tushuntir, ijobiy, hayajonli tarzda"
  }
}

"normal" = past xavf, "attention" = o'rta xavf, "danger" = yuqori xavf.`;

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private anthropic: Anthropic | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  }

  /**
   * Domen ballari (anonim, shaxsiy ma'lumotsiz) asosida risk darajasini aniqlaydi.
   * AI'ga ism/familiya/maktab kabi shaxsiy ma'lumotlar HECH QACHON yuborilmaydi.
   */
  async analyze(
    domainScores: Record<string, number>,
    grade: string,
  ): Promise<AiAnalysisResult> {
    if (this.anthropic) {
      try {
        return await this.analyzeWithClaude(domainScores, grade);
      } catch (e) {
        this.logger.warn(`Claude tahlili amalga oshmadi, fallback ishlatiladi: ${e.message}`);
      }
    }
    return this.analyzeWithRules(domainScores);
  }

  private async analyzeWithClaude(
    domainScores: Record<string, number>,
    grade: string,
  ): Promise<AiAnalysisResult> {
    const response = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ grade, domainScores }),
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude javobida JSON topilmadi');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!['normal', 'attention', 'danger'].includes(parsed.level)) {
      throw new Error('Claude javobida noto\'g\'ri risk darajasi');
    }

    return {
      level: parsed.level as RiskLevel,
      insight: parsed.insight,
      recommendation: parsed.recommendation,
      studentMessage: parsed.studentMessage ?? '',
      studentType: parsed.studentType ?? { emoji: '🌟', title: 'Noyob', desc: 'Sen o\'zingcha noyob insonsan!' },
    };
  }

  /** AI kaliti bo'lmasa yoki xato bo'lsa ishlaydigan qoida-asosli tahlil. */
  private analyzeWithRules(domainScores: Record<string, number>): AiAnalysisResult {
    const total = Object.values(domainScores).reduce((sum, v) => sum + v, 0);
    const maxSingle = Math.max(...Object.values(domainScores), 0);

    let level: RiskLevel;
    if (total >= 25 || maxSingle >= 8) {
      level = RiskLevel.DANGER;
    } else if (total >= 14 || maxSingle >= 5) {
      level = RiskLevel.ATTENTION;
    } else {
      level = RiskLevel.NORMAL;
    }

    const [dominantDomain] = Object.entries(domainScores).sort(
      (a, b) => b[1] - a[1],
    )[0] ?? ['', 0];

    // Har bir dominant domain → o'quvchi uchun ijobiy "tur"
    const TYPE_MAP: Record<string, StudentType> = {
      aggression: {
        emoji: '🦁',
        title: 'Kuchli ruh',
        desc: 'Senda boshqalar yo\'qolsin degan iroda bor. Bu kuch — uni to\'g\'ri yo\'naltirsang, hamma seni kuzatadi!',
      },
      bullying: {
        emoji: '💎',
        title: 'Olmos',
        desc: 'Bosim ostida ham sinmaysan. Bunday odamlardan haqiqiy yetakchilar chiqadi!',
      },
      emotional: {
        emoji: '🎨',
        title: 'Sezgir ijodkor',
        desc: 'Sen narsalarni boshqalar ko\'rmaydigan tarzda his qilasiz. Bu — kamdan-kam uchraydigan sovg\'a!',
      },
      peer: {
        emoji: '🚀',
        title: 'Mustaqil',
        desc: 'O\'z yo\'lingdan bormaysiz. Maqsadli odamlar esa doim olg\'a boradi!',
      },
      conduct: {
        emoji: '⚡',
        title: 'Erkin ruh',
        desc: 'Qoliplarga sig\'maydigan odamlar tarixda iz qoldiradi. Sendagi energia — bu kuch!',
      },
      substance: {
        emoji: '🏆',
        title: 'Irodali',
        desc: 'Qiyin vaziyatlarda ham o\'zing bo\'lib qolish — bu hamma ham uddalay olmaydigan narsa!',
      },
      prosocial: {
        emoji: '🌟',
        title: 'Yashirin yulduz',
        desc: 'Sendagi potensial hali to\'liq ochilib kelmagan. Bir qadam tashlasang — hammani hayratda qoldirasiz!',
      },
    };

    const NORMAL_TYPES: StudentType[] = [
      { emoji: '🤝', title: 'Do\'stsevar', desc: 'Atrofingilar bilan munosabating zo\'r — bunday odamlar har joyda o\'zini topadi!' },
      { emoji: '🧠', title: 'Aqlli', desc: 'Vaziyatlarni to\'g\'ri o\'qiy olasiz — bu katta ustunlik!' },
      { emoji: '☀️', title: 'Ijobiy', desc: 'Sendagi energiya atrofingilarni ham quvontiradi. Shunday davom et!' },
    ];

    const insight =
      DOMAIN_INSIGHTS[dominantDomain] ??
      "Bir nechta yo'nalish bo'yicha o'rtacha darajadan yuqori risk ko'rsatkichlari aniqlandi";
    const domainLabel = DOMAIN_LABELS[dominantDomain] ?? dominantDomain;

    const recommendation =
      level === RiskLevel.DANGER
        ? `"${domainLabel}" yo'nalishi bo'yicha o'quvchi bilan tezkor individual suhbat o'tkazish va ota-ona bilan bog'lanish tavsiya etiladi`
        : level === RiskLevel.ATTENTION
        ? `"${domainLabel}" yo'nalishi bo'yicha o'quvchini kuzatuvga olish va keyingi testlarda natijani qayta baholash tavsiya etiladi`
        : "Hozircha qo'shimcha chora ko'rishga ehtiyoj yo'q, kuzatuvda davom ettirilsin";

    const studentType =
      level === RiskLevel.NORMAL
        ? NORMAL_TYPES[Math.floor(Math.random() * NORMAL_TYPES.length)]
        : (TYPE_MAP[dominantDomain] ?? { emoji: '🌟', title: 'Noyob', desc: 'Sen o\'zingcha noyob insonsan — boshqa hech kim sen kabi emas!' });

    return {
      level,
      insight: level === RiskLevel.NORMAL ? "Umumiy ko'rsatkichlar normal darajada" : insight,
      recommendation,
      studentMessage: '',
      studentType,
    };
  }
}

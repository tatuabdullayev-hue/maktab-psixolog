import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { RiskLevel } from '../../database/entities';

export interface AiAnalysisResult {
  level: RiskLevel;
  insight: string;
  recommendation: string;
  studentMessage: string;
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
  "studentMessage": "1-2 iliq, rag'batlantiruvchi jumla — to'g'ridan-to'g'ri O'QUVCHIGA murojaat qilib, uning kuchli tomonini yoki o'sish yo'lini ko'rsat. Muammo yoki test haqida hech narsa aytma. Ijobiy, samimiy, bolaga mos tilda yoz."
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
    };
  }

  /** AI kaliti bo'lmasa yoki xato bo'lsa ishlaydigan qoida-asosli tahlil. */
  private analyzeWithRules(domainScores: Record<string, number>): AiAnalysisResult {
    const total = Object.values(domainScores).reduce((sum, v) => sum + v, 0);
    const maxSingle = Math.max(...Object.values(domainScores), 0);

    // Birorta domain 8+ ball → danger; umumiy 25+ → danger; 14+ → attention
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

    const STUDENT_MESSAGES_NORMAL: string[] = [
      "Zo'r! Sendagi kuch va mehribonlik atrofingilarni quvontiradi. Shunday davom et!",
      "Sen juda yaxshi insonsan — bu sifatlarni asrab qol va do'stlaringga ham ulash!",
      "Hayotda muvaffaqiyat sening ichingda — sen allaqachon to'g'ri yo'ldasn!",
    ];

    const STUDENT_MESSAGES_ATTENTION: Record<string, string> = {
      aggression: "G'azabingni his qilish odatiy narsa, lekin uni nazorat qila olsang — bu juda katta kuch! Har kuni bir marta chuqur nafas ol.",
      bullying: "Sen ham, atrofingilar ham hurmatga loyiq. Birovga qo'l uzatsang, ikkalangiz ham yutasiz!",
      emotional: "Hissiyotlaring sening kuchingling — ularni yashirma, ishonchli odamga ayt. Ichingdagi quyosh doim bor!",
      peer: "Do'st topish ba'zan qiyin, lekin bitta chin do'st yuzta tanishdan qimmat. Avval o'zing birovga do'st bo'lishga harakat qil!",
      conduct: "Har bir kun yangi boshlanish — kecha nima bo'lgan bo'lsa ham, bugun boshqacha tanlov qila olasiz!",
      substance: "Sendagi irodani ko'r — qiyin paytlarda ham to'g'ri yo'l tanlash o'zingda!",
      prosocial: "Birovga yordam berish — eng katta baxt. Bir kun bitta kichik yaxshilik qil, natijasini ko'rasan!",
    };

    const STUDENT_MESSAGES_DANGER: Record<string, string> = {
      aggression: "Ichingda juda katta his-tuyg'ular bor — bu sening kuchingling. Ularni to'g'ri yo'naltirsang, zo'r narsa qila olasiz!",
      bullying: "Sen yolg'iz emassan. Qiyin his qilsang, ishonchli kattalarga ayt — ular yordam beradi!",
      emotional: "Ba'zan hayot og'ir tuyuladi — lekin bu o'tkinchi. Sen kuchli va qimmatli insonsan, hech qachon unutma!",
      peer: "Yolg'izlik vaqtinchalik. Seni tushunuvchi odamlar bor — faqat ularga o'zing ham ochilishga ruxsat ber!",
      conduct: "Har kim xato qiladi — muhimi shundan o'rganish. Ertangi sen bugungi sendan yaxshiroq bo'la oladi!",
      substance: "Sendagi irodani hech narsa yengolmaydi — to'g'ri odamlarni yon olsang, har qanday qiyinlikni yengasiz!",
      prosocial: "Sendagi yaxshilik hali to'liq ochilmagan — faqat bitta qadam tashla, atrofingilar seni ko'radi!",
    };

    if (level === RiskLevel.NORMAL) {
      const msg = STUDENT_MESSAGES_NORMAL[Math.floor(Math.random() * STUDENT_MESSAGES_NORMAL.length)];
      return {
        level,
        insight: "Umumiy ko'rsatkichlar normal darajada, alohida e'tibor talab etilmaydi",
        recommendation: "Hozircha qo'shimcha chora ko'rishga ehtiyoj yo'q, kuzatuvda davom ettirilsin",
        studentMessage: msg,
      };
    }

    const insight =
      DOMAIN_INSIGHTS[dominantDomain] ??
      "Bir nechta yo'nalish bo'yicha o'rtacha darajadan yuqori risk ko'rsatkichlari aniqlandi";
    const domainLabel = DOMAIN_LABELS[dominantDomain] ?? dominantDomain;

    const recommendation =
      level === RiskLevel.DANGER
        ? `"${domainLabel}" yo'nalishi bo'yicha o'quvchi bilan tezkor individual suhbat o'tkazish va ota-ona bilan bog'lanish tavsiya etiladi`
        : `"${domainLabel}" yo'nalishi bo'yicha o'quvchini kuzatuvga olish va keyingi testlarda natijani qayta baholash tavsiya etiladi`;

    const msgMap = level === RiskLevel.DANGER ? STUDENT_MESSAGES_DANGER : STUDENT_MESSAGES_ATTENTION;
    const studentMessage =
      msgMap[dominantDomain] ??
      "Sen kuchli insonsan — har qanday qiyinlikni yengib o'ta olasiz. Oldinga!";

    return { level, insight, recommendation, studentMessage };
  }
}

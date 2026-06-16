import '../rec.css';

interface Program {
  name: string;
  source: string;
  desc: string;
}

interface Action {
  icon: string;
  title: string;
  detail: string;
}

interface Section {
  level: 'danger' | 'attention';
  label: string;
  labelColor: string;
  labelBg: string;
  borderColor: string;
  headBg: string;
  intro: string;
  actions: Action[];
  programs: Program[];
  warning?: string;
}

const SECTIONS: Section[] = [
  {
    level: 'danger',
    label: 'YUQORI XAVF GURUHI',
    labelColor: '#dc2626',
    labelBg: '#fee2e2',
    borderColor: '#dc2626',
    headBg: 'linear-gradient(135deg,#fef2f2 0%,#fff5f5 100%)',
    intro:
      'Jahon tadqiqotlari (WHO, APA, UNODC) ko\'rsatishicha, yuqori xavf guruhidagi o\'quvchilar tezkor, ko\'p qatlamli psixologik yordam olmasa, jinoyatchilik va deviant xulq-atvor ehtimoli 3–5 barobar yuqori bo\'ladi. Quyidagi aralashuvlar ilmiy jihatdan tasdiqlangan (evidence-based).',
    warning: 'Bu guruhda faqat maslahatlashuv yetarli emas — har bir bolaga individual holda yondashish va muntazam kuzatuv majburiy.',
    actions: [
      {
        icon: '🧠',
        title: 'Multisistemli terapiya (MST)',
        detail:
          'Dunyo bo\'yicha jinoyatchilikni oldini olishda №1 sifatida tan olingan usul (Henggeler, 1998). Bola, oila, maktab va tengdoshlar bilan bir vaqtda ishlaydi. Haftalik 3–5 seans, 3–5 oy davomida. Recidivizmni 25–70% ga kamaytiradi.',
      },
      {
        icon: '👨‍👩‍👧',
        title: 'Oila bilan majburiy suhbat',
        detail:
          'O\'quvchi xulq-atvorining 60–70% uy muhiti bilan bog\'liq (Farrington, 2003). Ota-onani chaqirib, xavf omillari, uy ichidagi munosabatlar, nazorat darajasi muhokama qilinadi. Ota-onaga ham psixologik yordam tavsiya etiladi.',
      },
      {
        icon: '📋',
        title: 'Kognitiv-xulqiy terapiya (CBT)',
        detail:
          '40+ mamlakatda tasdiqlangan (Meta-analiz: Lipsey, 2009). Agressiya, impulsivlik va noto\'g\'ri fikrlash shakllarini o\'zgartiradi. Guruhda yoki individual 12–16 seans. Zo\'ravonlik va antisosial xulqni 30–50% kamaytiradi.',
      },
      {
        icon: '🎯',
        title: 'Individual mentor (Big Brother/Big Sister modeli)',
        detail:
          'BBBS dasturi (AQSh, Kanada) — har bir yuqori xavfli bolaga katta yoshli ijobiy namuna-mentor biriktiriladi. Haftalik 4 soat. Giyohvand modda ishlatish 46%, zo\'ravonlik 32% kamayadi (Tierney & Grossman, 1995).',
      },
      {
        icon: '🚨',
        title: 'Sinf rahbari va mahalla bilan koordinatsiya',
        detail:
          'Bolaning maktab, uy va ko\'cha muhiti birgalikda nazorat qilinmasa, terapiya samara bermaydi. Psixolog, sinf rahbari va mahalla inspektori oyiga kamida 1 marta ma\'lumot almashishi shart.',
      },
      {
        icon: '📊',
        title: 'Oylik dinamika kuzatuvi',
        detail:
          'Har oy qayta baholash: SDQ, Buss-Perry yoki psixolog kuzatuvi orqali xulq-atvor o\'zgarishini o\'lchash. Yaxshilanmasa — intensivlikni oshirish yoki ixtisoslashtirilgan muassasaga yo\'naltirish.',
      },
    ],
    programs: [
      {
        name: 'Multisystemic Therapy (MST)',
        source: 'Henggeler et al., 1998 · APA Division 53',
        desc: 'Jinoyat recidivizmini 25–70% kamaytiradi. 50+ mamlakatda qo\'llaniladi.',
      },
      {
        name: 'Functional Family Therapy (FFT)',
        source: 'Alexander & Parsons, 1973 · OJJDP tasdiqlangan',
        desc:
          'Oiladagi munosabat modellarini tiklaydi. 60% bola keyingi jinoyatga qaytmaydi.',
      },
      {
        name: 'Aggression Replacement Training (ART)',
        source: 'Goldstein, 1987 · 30 mamlakatda qo\'llaniladi',
        desc:
          'Agressiya, axloqiy muhokama va ijtimoiy ko\'nikmalar — 3 blokli kurs, 10 hafta.',
      },
      {
        name: 'Positive Behavioral Interventions (PBIS)',
        source: 'OSEP Technical Assistance Center, AQSh',
        desc:
          'Maktab muhitini butunlay restrukturizatsiya qilish. Intizom muammolarini 60% kamaytiradi.',
      },
    ],
  },
  {
    level: 'attention',
    label: 'O\'RTA XAVF GURUHI',
    labelColor: '#d97706',
    labelBg: '#fef3c7',
    borderColor: '#f59e0b',
    headBg: 'linear-gradient(135deg,#fffbeb 0%,#fefce8 100%)',
    intro:
      'O\'rta xavf guruhidagi o\'quvchilar hali yuqori xavfga o\'tib ketmagan — bu eng samarali aralashuv oynasi. Tadqiqotlar (Catalano & Hawkins, 1996) ko\'rsatadiki, bu bosqichda to\'g\'ri yondashuv yuqori xavfga o\'tish ehtimolini 70% gacha kamaytiradi.',
    actions: [
      {
        icon: '💬',
        title: 'Guruhli ijtimoiy ko\'nikmalar treningi',
        detail:
          'Tengdoshlar bilan munosabat, nizolarni tinch hal qilish, his-tuyg\'ularni boshqarish. Haftada 1 marta, 45 daqiqa, 8–12 hafta. PATHS, Second Step kabi dasturlar asosida (Durlak, 2011).',
      },
      {
        icon: '📚',
        title: 'Dars jarayonida qo\'shimcha qo\'llab-quvvatlash',
        detail:
          'O\'quv qiyinchiliklari ko\'pincha deviant xulqning asl sababi (Maguin & Loeber, 1996). Riyoziyot, ona tili bo\'yicha qo\'shimcha darslar yoki tutor ajratish. Natija: o\'qish ko\'rsatkichi + xulq yaxshilanadi.',
      },
      {
        icon: '🌱',
        title: 'Ijobiy faoliyatga jalb etish',
        detail:
          'Sport seksiyasi, san\'at, musiqa, ixtiyoriy mehnat — bo\'sh vaqtni tuzilmalashtirish. Bo\'sh vaqt deviant guruhlar bilan aloqaning asosiy sababi (Osgood, 1999). Har bir bola haftasiga kamida 1 to\'garakda bo\'lishi maqsadga muvofiq.',
      },
      {
        icon: '👀',
        title: 'Tengdoshlar guruhini kuzatish',
        detail:
          'Kimlar bilan do\'stlashayotgani — eng muhim xavf omili (Dishion & Dodge, 2005). Antisosial tengdosh guruhiga kirsa, o\'rtacha xavf 6 oyda yuqori xavfga o\'tishi mumkin. Sinf rahbari bilan muntazam ma\'lumot almashuvi kerak.',
      },
      {
        icon: '🤝',
        title: 'Ota-onani mustahkamlash (Parenting Programs)',
        detail:
          'Incredible Years, Triple P kabi dasturlar asosida ota-onaga ijobiy intizom usullarini o\'rgatish. Ota-onani o\'qitish bolaning xulqini 40% yaxshilaydi (Webster-Stratton, 2001).',
      },
      {
        icon: '📅',
        title: 'Chorakda bir marta psixologik baholash',
        detail:
          'SDQ yoki o\'xshash asbob bilan har 3 oyda holat tekshiriladi. Yaxshilanmasa — yuqori xavfga o\'tkazib, intensiv aralashuvga yo\'naltirish. Yaxshilansa — nazorat davom ettiriladi.',
      },
    ],
    programs: [
      {
        name: 'Second Step (Social-Emotional Learning)',
        source: 'Committee for Children · 70+ mamlakatda',
        desc: 'Ijtimoiy-emotional ko\'nikmalar. Agressiv xulqni 46% kamaytiradi.',
      },
      {
        name: 'PATHS (Promoting Alternative Thinking Strategies)',
        source: 'Greenberg & Kusche, 1993 · Blueprints Model',
        desc:
          'Maktabda his-tuyg\'ularni tartibga solish va muammolarni hal qilish ko\'nikmalari.',
      },
      {
        name: 'Life Skills Training (LST)',
        source: 'Botvin, 1984 · NIDA tasdiqlangan',
        desc:
          'Giyohvand moddalar, zo\'ravonlik va ijtimoiy bosimga qarshilik. 75% samaradorlik.',
      },
      {
        name: 'Triple P (Positive Parenting Program)',
        source: 'Sanders, 1999 · 25 mamlakatda',
        desc:
          'Ota-onalar uchun. Bolalar xulq muammolarini 30–40% kamaytiradi.',
      },
    ],
  },
];

export function Recommendations() {
  return (
    <div className="dashboard">
      <div className="topbar">
        <h1 className="topbar__title">Tavsiyalar</h1>
        <p className="rec-subtitle">
          Jinoyatchilik va deviant xulqni barvaqt oldini olish — ilmiy asoslangan amaliyotlar
        </p>
      </div>

      {/* Kirish bloki */}
      <div className="rec-intro-card">
        <div className="rec-intro-icon">🌍</div>
        <div>
          <h3 className="rec-intro-title">Dunyo tajribasiga asoslangan yondashuv</h3>
          <p className="rec-intro-text">
            Quyidagi tavsiyalar WHO, UNODC, APA va Blueprints for Healthy Youth Development
            ma'lumotlar bazasida tasdiqlangan dasturlar asosida tuzilgan. Har bir tavsiya kamida
            bitta nazorat tadqiqoti (RCT) bilan isbotlangan.
          </p>
          <div className="rec-intro-sources">
            <span className="rec-source-chip">WHO 2023</span>
            <span className="rec-source-chip">UNODC Youth Crime Prevention</span>
            <span className="rec-source-chip">APA Division 53</span>
            <span className="rec-source-chip">Blueprints Model Programs</span>
            <span className="rec-source-chip">OJJDP Evidence-Based</span>
          </div>
        </div>
      </div>

      {SECTIONS.map(sec => (
        <div
          key={sec.level}
          className="rec-section"
          style={{ borderColor: sec.borderColor }}
        >
          {/* Sarlavha */}
          <div className="rec-section__head" style={{ background: sec.headBg }}>
            <span
              className="rec-section__badge"
              style={{ background: sec.labelBg, color: sec.labelColor, borderColor: sec.borderColor }}
            >
              {sec.level === 'danger' ? '🔴' : '🟡'} {sec.label}
            </span>
            <p className="rec-section__intro">{sec.intro}</p>
            {sec.warning && (
              <div className="rec-warning" style={{ borderColor: sec.borderColor, color: sec.labelColor }}>
                ⚠️ {sec.warning}
              </div>
            )}
          </div>

          {/* Amaliy tavsiyalar */}
          <div className="rec-section__body">
            <h3 className="rec-group-title">Amaliy aralashuvlar</h3>
            <div className="rec-actions-grid">
              {sec.actions.map((a, i) => (
                <div
                  key={i}
                  className="rec-action-card"
                  style={{ borderTopColor: sec.borderColor }}
                >
                  <div className="rec-action-card__icon">{a.icon}</div>
                  <div className="rec-action-card__title">{a.title}</div>
                  <div className="rec-action-card__detail">{a.detail}</div>
                </div>
              ))}
            </div>

            {/* Dasturlar */}
            <h3 className="rec-group-title" style={{ marginTop: 28 }}>
              Ilmiy asoslangan dasturlar (Evidence-Based Programs)
            </h3>
            <div className="rec-programs-list">
              {sec.programs.map((p, i) => (
                <div key={i} className="rec-program-row">
                  <div className="rec-program-row__dot" style={{ background: sec.labelColor }} />
                  <div className="rec-program-row__body">
                    <span className="rec-program-row__name">{p.name}</span>
                    <span className="rec-program-row__source">{p.source}</span>
                    <span className="rec-program-row__desc">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Umumiy xulosa */}
      <div className="rec-conclusion">
        <div className="rec-conclusion__icon">📌</div>
        <div>
          <h3>Eslatma</h3>
          <p>
            Hech qanday dastur yoki tavsiya bir marta qo'llanilganda to'liq natija bermaydi.
            Muntazamlik, oila ishtirok etishi va maktab-psixolog-mahalla hamkorligi — muvaffaqiyatning
            asosiy shartidir. Og'ir hollarda ixtisoslashtirilgan klinik psixolog yoki psixiatristga
            yo'naltirish zarur.
          </p>
        </div>
      </div>
    </div>
  );
}

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumberElement,
  UnderlineType,
} from 'docx';
import { saveAs } from 'file-saver';

interface Student {
  fullName: string;
  className: string;
  level: string;
  aiInsight: string | null;
  aiRecommendation: string | null;
  completedAt: string;
}

interface NoteEntry {
  student?: { firstName: string; lastName?: string; className?: string } | null;
  studentId: string;
  type: string;
  note: string;
  nextStep?: string | null;
  createdAt: string;
}

interface ReportData {
  school: string;
  district: string;
  total: number;
  danger: number;
  attention: number;
  normal: number;
  students: Student[];
  notes: NoteEntry[];
}

const TYPE_LABELS: Record<string, string> = {
  student_talk: "O'quvchi bilan suhbat",
  parent_talk: 'Ota-ona bilan suhbat',
  teacher_talk: 'Sinf rahbari bilan suhbat',
  other: 'Boshqa kuzatuv',
};

const FONT = 'Times New Roman';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function pct(num: number, total: number) {
  return total ? `${Math.round(num / total * 100)}%` : '0%';
}

function run(text: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? 22, bold: opts.bold, color: opts.color, italics: opts.italics });
}

function p(children: TextRun[], spacing?: { before?: number; after?: number }, align?: (typeof AlignmentType)[keyof typeof AlignmentType]) {
  return new Paragraph({ children, spacing: { before: spacing?.before ?? 80, after: spacing?.after ?? 80 }, alignment: align });
}

function sectionHeader(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, underline: { type: UnderlineType.SINGLE } })],
    spacing: { before: 320, after: 160 },
  });
}

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
};

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function cell(text: string, isHeader = false, width = 2000) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: isHeader ? { type: ShadingType.CLEAR, fill: '1e3a5f' } : undefined,
    borders: CELL_BORDER,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({
          text,
          bold: isHeader,
          color: isHeader ? 'FFFFFF' : '000000',
          size: 20,
          font: FONT,
        })],
      }),
    ],
  });
}

function noBorderCell(children: Paragraph[], width = 4500) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: NO_BORDER,
    children,
  });
}

export async function generateWordReport(data: ReportData) {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  const period = `${fmt(sixMonthsAgo.toISOString())} – ${fmt(today.toISOString())}`;
  const generatedAt = today.toLocaleDateString('uz-UZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const recentNotes = data.notes.filter(n => new Date(n.createdAt) >= sixMonthsAgo);

  const typeStats: Record<string, number> = {};
  recentNotes.forEach(n => {
    typeStats[n.type] = (typeStats[n.type] ?? 0) + 1;
  });

  const dangerStudents = data.students.filter(s => s.level === 'danger');
  const attentionStudents = data.students.filter(s => s.level === 'attention');

  const doc = new Document({
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [run(`${data.district}, ${data.school}`, { size: 18, color: '666666' })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                run('Sahifa ', { size: 18 }),
                new PageNumberElement(),
                run('  |  Maxfiy — faqat xizmat uchun', { size: 18, color: '999999' }),
              ],
            }),
          ],
        }),
      },
      children: [

        // ════ SARLAVHA ════
        p([run("O'ZBEKISTON RESPUBLIKASI", { bold: true })], { before: 0, after: 60 }, AlignmentType.CENTER),
        p([run(`NAMANGAN VILOYATI ${data.district.toUpperCase()}`, { bold: true })], { before: 0, after: 60 }, AlignmentType.CENTER),
        p([run(`${data.school.toUpperCase()} MAKTAB PSIXOLOGI`, { bold: true })], { before: 0, after: 200 }, AlignmentType.CENTER),

        p([run('HISOBOT', { bold: true, size: 36 })], { before: 0, after: 60 }, AlignmentType.CENTER),
        p([run("Jinoyatchilik va deviant xulqni barvaqt oldini olish bo'yicha", { bold: true, size: 24 })], { before: 0, after: 60 }, AlignmentType.CENTER),
        p([run(`Hisobot davri: ${period}`, { italics: true })], { before: 0, after: 400 }, AlignmentType.CENTER),

        // ════ 1. UMUMIY MA'LUMOT ════
        sectionHeader("1. Umumiy ma'lumot"),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [cell("Ko'rsatkich", true, 4500), cell('Qiymat', true, 4500)] }),
            new TableRow({ children: [cell('Maktab'), cell(data.school)] }),
            new TableRow({ children: [cell('Tuman'), cell(data.district)] }),
            new TableRow({ children: [cell('Hisobot davri'), cell(period)] }),
            new TableRow({ children: [cell("Jami test topshirgan o'quvchilar"), cell(`${data.total} nafar`)] }),
            new TableRow({ children: [cell('Hisobot tuzilgan sana'), cell(generatedAt)] }),
          ],
        }),

        // ════ 2. RISK TAHLILI ════
        sectionHeader("2. Risk darajasi bo'yicha tahlil"),
        p([run('AI tizimi (Claude Sonnet) tomonidan o\'tkazilgan psixologik tahlil natijalari:', { bold: true })]),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [cell('Risk darajasi', true, 3000), cell("O'quvchilar soni", true, 3000), cell('Ulushi (%)', true, 3000)] }),
            new TableRow({ children: [cell('Yuqori xavf (DANGER)'), cell(`${data.danger} nafar`), cell(pct(data.danger, data.total))] }),
            new TableRow({ children: [cell("O'rta xavf (ATTENTION)"), cell(`${data.attention} nafar`), cell(pct(data.attention, data.total))] }),
            new TableRow({ children: [cell('Past xavf (NORMAL)'), cell(`${data.normal} nafar`), cell(pct(data.normal, data.total))] }),
            new TableRow({ children: [cell('JAMI', true), cell(`${data.total} nafar`), cell('100%')] }),
          ],
        }),

        // ════ 3. YUQORI XAVF GURUHI ════
        sectionHeader("3. Yuqori xavf guruhi o'quvchilari va AI tahlili"),

        ...(dangerStudents.length === 0
          ? [p([run("Yuqori xavf darajasidagi o'quvchi aniqlanmagan.")])]
          : [
            p([run(`Quyida yuqori xavf (DANGER) darajasi aniqlangan ${dangerStudents.length} nafar o'quvchi ro'yxati va AI tizimi xulosasi keltirilgan:`)]),
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                new TableRow({ children: [cell('Nr', true, 600), cell('F.I.O.', true, 2200), cell('Sinf', true, 700), cell('AI xulosasi', true, 5500)] }),
                ...dangerStudents.map((s, i) =>
                  new TableRow({ children: [cell(`${i + 1}`), cell(s.fullName), cell(s.className), cell(s.aiInsight ?? 'Xulosa mavjud emas')] })
                ),
              ],
            }),
          ]
        ),

        // ════ 4. O'RTA XAVF GURUHI ════
        sectionHeader("4. O'rta xavf guruhi o'quvchilari"),

        ...(attentionStudents.length === 0
          ? [p([run("O'rta xavf darajasidagi o'quvchi aniqlanmagan.")])]
          : [
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                new TableRow({ children: [cell('Nr', true, 600), cell('F.I.O.', true, 2200), cell('Sinf', true, 700), cell('AI xulosasi', true, 5500)] }),
                ...attentionStudents.map((s, i) =>
                  new TableRow({ children: [cell(`${i + 1}`), cell(s.fullName), cell(s.className), cell(s.aiInsight ?? 'Xulosa mavjud emas')] })
                ),
              ],
            }),
          ]
        ),

        // ════ 5. PSIXOLOG ISH JURNALI ════
        sectionHeader(`5. Psixolog ishi jurnali (so'nggi 6 oy)`),
        p([run(`Hisobot davri: ${period}`, { italics: true })]),
        p([run(`Jami kiritilgan ish yozuvlari: ${recentNotes.length} ta`, { bold: true })]),
        ...Object.entries(typeStats).map(([type, count]) =>
          p([run(`• ${TYPE_LABELS[type] ?? type}: ${count} ta`)], { before: 40, after: 40 })
        ),

        new Paragraph({ spacing: { before: 120 }, children: [] }),

        ...(recentNotes.length === 0
          ? [p([run("So'nggi 6 oy ichida hech qanday ish kiritilmagan.")])]
          : [
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                new TableRow({ children: [
                  cell('Sana', true, 1100),
                  cell("O'quvchi", true, 1900),
                  cell('Sinf', true, 700),
                  cell('Ish turi', true, 1800),
                  cell('Amalga oshirilgan ish', true, 2300),
                  cell('Keyingi qadam', true, 1200),
                ] }),
                ...recentNotes.map(n => {
                  const name = n.student
                    ? `${n.student.firstName} ${n.student.lastName ?? ''}`.trim()
                    : '—';
                  return new TableRow({ children: [
                    cell(fmt(n.createdAt)),
                    cell(name),
                    cell(n.student?.className ?? '—'),
                    cell(TYPE_LABELS[n.type] ?? n.type),
                    cell(n.note),
                    cell(n.nextStep ?? '—'),
                  ] });
                }),
              ],
            }),
          ]
        ),

        // ════ 6. XULOSA VA TAVSIYALAR ════
        sectionHeader('6. Xulosa va tavsiyalar'),

        p([run('Umumiy xulosa:', { bold: true })]),
        p([run(
          `${data.district} ${data.school} maktabida o'tkazilgan AI asosidagi psixologik tahlil natijalari shuni ko'rsatadiki, ` +
          `${data.total} nafar o'quvchidan ${data.danger} nafari (${pct(data.danger, data.total)}) yuqori xavf guruhiga, ` +
          `${data.attention} nafari (${pct(data.attention, data.total)}) o'rta xavf guruhiga kiradi.`
        )]),

        p([run('Tavsiyalar:', { bold: true })], { before: 160, after: 80 }),
        p([run("1. Yuqori xavf guruhidagi o'quvchilar bilan tezkor individual suhbat tashkil etilsin.")], { before: 40, after: 40 }),
        p([run("2. Ota-onalar bilan uchrashuv o'tkazilib, oilaviy muhit muhokama qilinsin.")], { before: 40, after: 40 }),
        p([run("3. Sinf rahbarlari xavfli ko'rsatkich aniqlangan o'quvchilarni kuzatuvga olsin.")], { before: 40, after: 40 }),
        p([run("4. Zarur hollarda tuman/viloyat psixolog-markazi bilan hamkorlik yo'lga qo'yilsin.")], { before: 40, after: 40 }),
        p([run("5. Keyingi 3 oy ichida qayta baholash o'tkazilsin.")], { before: 40, after: 40 }),

        // ════ IMZO ════
        new Paragraph({ spacing: { before: 600 }, children: [] }),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              noBorderCell([p([run('Maktab psixologi:', { bold: true })])]),
              noBorderCell([p([run('________________ / ________________')])]),
            ] }),
            new TableRow({ children: [
              noBorderCell([p([run('Sana:', { bold: true })])]),
              noBorderCell([p([run(generatedAt)])]),
            ] }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Hisobot_${data.school}_${today.toISOString().slice(0, 10)}.docx`;
  saveAs(blob, filename);
}

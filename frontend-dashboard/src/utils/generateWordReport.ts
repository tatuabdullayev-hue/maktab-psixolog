import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumberElement,
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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function bold(text: string, size = 22) {
  return new TextRun({ text, bold: true, size, font: 'Times New Roman' });
}

function normal(text: string, size = 22) {
  return new TextRun({ text, size, font: 'Times New Roman' });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({
    heading: level,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Times New Roman' })],
  });
}

function para(children: TextRun[], spacing = { before: 80, after: 80 }) {
  return new Paragraph({ children, spacing });
}

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '1e3a5f' },
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
          font: 'Times New Roman',
        })],
      }),
    ],
  });
}

function noBorderCell(children: Paragraph[], width = 4500) {
  const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: nb, bottom: nb, left: nb, right: nb },
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
              children: [new TextRun({
                text: `${data.district}, ${data.school}`,
                size: 18,
                color: '666666',
                font: 'Times New Roman',
              })],
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
                new TextRun({ text: 'Sahifa ', size: 18, font: 'Times New Roman' }),
                new PageNumberElement(),
                new TextRun({ text: '  |  Maxfiy — faqat xizmat uchun', size: 18, color: '999999', font: 'Times New Roman' }),
              ],
            }),
          ],
        }),
      },
      children: [

        // ═══════ SARLAVHA ═══════
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: "O'ZBEKISTON RESPUBLIKASI", size: 22, bold: true, font: 'Times New Roman' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: `NAMANGAN VILOYATI ${data.district.toUpperCase()}`, size: 22, bold: true, font: 'Times New Roman' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
          children: [new TextRun({ text: `${data.school.toUpperCase()} MAKTAB PSIXOLOGI`, size: 22, bold: true, font: 'Times New Roman' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: 'HISOBOT', size: 36, bold: true, font: 'Times New Roman' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: "Jinoyatchilik va deviant xulqni barvaqt oldini olish bo'yicha", size: 24, bold: true, font: 'Times New Roman' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
          children: [new TextRun({ text: `Hisobot davri: ${period}`, size: 22, italics: true, font: 'Times New Roman' })],
        }),

        // ═══════ 1. UMUMIY MA'LUMOT ═══════
        heading("1. Umumiy ma'lumot", HeadingLevel.HEADING_1),

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

        // ═══════ 2. RISK TAHLILI ═══════
        heading("2. Risk darajasi bo'yicha tahlil", HeadingLevel.HEADING_1),

        para([bold('AI tizimi (Claude Sonnet) tomonidan o\'tkazilgan psixologik tahlil natijalari:')]),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [cell('Risk darajasi', true, 3000), cell("O'quvchilar soni", true, 3000), cell('Ulushi (%)', true, 3000)] }),
            new TableRow({ children: [cell('Yuqori xavf (DANGER)'), cell(`${data.danger} nafar`), cell(data.total ? `${Math.round(data.danger / data.total * 100)}%` : '0%')] }),
            new TableRow({ children: [cell("O'rta xavf (ATTENTION)"), cell(`${data.attention} nafar`), cell(data.total ? `${Math.round(data.attention / data.total * 100)}%` : '0%')] }),
            new TableRow({ children: [cell('Past xavf (NORMAL)'), cell(`${data.normal} nafar`), cell(data.total ? `${Math.round(data.normal / data.total * 100)}%` : '0%')] }),
            new TableRow({ children: [cell('JAMI', true), cell(`${data.total} nafar`), cell('100%')] }),
          ],
        }),

        // ═══════ 3. YUQORI XAVF GURUHI ═══════
        heading("3. Yuqori xavf guruhi o'quvchilari va AI tahlili", HeadingLevel.HEADING_1),

        ...(dangerStudents.length === 0
          ? [para([normal("Yuqori xavf darajasidagi o'quvchi aniqlanmagan.")])]
          : [
            para([normal(`Quyida yuqori xavf (DANGER) darajasi aniqlangan ${dangerStudents.length} nafar o'quvchi ro'yxati va AI tizimi xulosasi keltirilgan:`)]),
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                new TableRow({ children: [cell('№', true, 600), cell('F.I.O.', true, 2200), cell('Sinf', true, 700), cell('AI xulosasi', true, 5500)] }),
                ...dangerStudents.map((s, i) =>
                  new TableRow({ children: [
                    cell(`${i + 1}`),
                    cell(s.fullName),
                    cell(s.className),
                    cell(s.aiInsight ?? 'Xulosa mavjud emas'),
                  ] })
                ),
              ],
            }),
          ]
        ),

        // ═══════ 4. O'RTA XAVF GURUHI ═══════
        heading("4. O'rta xavf guruhi o'quvchilari", HeadingLevel.HEADING_1),

        ...(attentionStudents.length === 0
          ? [para([normal("O'rta xavf darajasidagi o'quvchi aniqlanmagan.")])]
          : [
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              rows: [
                new TableRow({ children: [cell('№', true, 600), cell('F.I.O.', true, 2200), cell('Sinf', true, 700), cell('AI xulosasi', true, 5500)] }),
                ...attentionStudents.map((s, i) =>
                  new TableRow({ children: [
                    cell(`${i + 1}`),
                    cell(s.fullName),
                    cell(s.className),
                    cell(s.aiInsight ?? 'Xulosa mavjud emas'),
                  ] })
                ),
              ],
            }),
          ]
        ),

        // ═══════ 5. PSIXOLOG ISH JURNALI ═══════
        heading(`5. Psixolog ishi jurnali (so'nggi 6 oy: ${period})`, HeadingLevel.HEADING_1),

        para([bold(`Jami kiritilgan ish yozuvlari: ${recentNotes.length} ta`)]),
        ...Object.entries(typeStats).map(([type, count]) =>
          para([normal(`• ${TYPE_LABELS[type] ?? type}: ${count} ta`)], { before: 40, after: 40 })
        ),

        new Paragraph({ spacing: { before: 160 }, children: [] }),

        ...(recentNotes.length === 0
          ? [para([normal("So'nggi 6 oy ichida hech qanday ish kiritilmagan.")])]
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

        // ═══════ 6. XULOSA VA TAVSIYALAR ═══════
        heading('6. Xulosa va tavsiyalar', HeadingLevel.HEADING_1),

        para([bold('Umumiy xulosa:')]),
        para([normal(
          `${data.district} ${data.school} maktabida o'tkazilgan AI asosidagi psixologik tahlil natijalari shuni ko'rsatadiki, ` +
          `${data.total} nafar o'quvchidan ${data.danger} nafari (${data.total ? Math.round(data.danger / data.total * 100) : 0}%) yuqori xavf guruhiga, ` +
          `${data.attention} nafari (${data.total ? Math.round(data.attention / data.total * 100) : 0}%) o'rta xavf guruhiga kiradi.`
        )]),

        para([bold('Tavsiyalar:')], { before: 160, after: 80 }),
        para([normal("1. Yuqori xavf guruhidagi o'quvchilar bilan tezkor individual suhbat tashkil etilsin.")]),
        para([normal('2. Ota-onalar bilan uchrashuv o\'tkazilib, oilaviy muhit muhokama qilinsin.')]),
        para([normal('3. Sinf rahbarlari xavfli ko\'rsatkich aniqlangan o\'quvchilarni kuzatuvga olsin.')]),
        para([normal('4. Zarur hollarda tuman/viloyat psixolog-markazi bilan hamkorlik yo\'lga qo\'yilsin.')]),
        para([normal('5. Keyingi 3 oy ichida qayta baholash o\'tkazilsin.')]),

        // ═══════ IMZO ═══════
        new Paragraph({ spacing: { before: 600 }, children: [] }),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [
              noBorderCell([para([bold('Maktab psixologi:')])]),
              noBorderCell([para([normal('________________ / ________________')])]),
            ] }),
            new TableRow({ children: [
              noBorderCell([para([bold('Sana:')])]),
              noBorderCell([para([normal(generatedAt)])]),
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

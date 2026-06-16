/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable } from '@nestjs/common';

export interface WordReportData {
  school: string;
  district: string;
  total: number;
  danger: number;
  attention: number;
  normal: number;
  students: Array<{
    fullName: string;
    className: string;
    level: string;
    aiInsight: string | null;
    completedAt: string;
  }>;
  notes: Array<{
    studentId: string;
    type: string;
    note: string;
    nextStep?: string | null;
    createdAt: string;
    student?: { firstName: string; lastName?: string; className?: string } | null;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  student_talk: "O'quvchi bilan suhbat",
  parent_talk: 'Ota-ona bilan suhbat',
  teacher_talk: 'Sinf rahbari bilan suhbat',
  other: 'Boshqa kuzatuv',
};

const FONT = 'Times New Roman';

function fmt(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function pct(num: number, total: number): string {
  return total ? `${Math.round((num / total) * 100)}%` : '0%';
}

@Injectable()
export class WordReportService {
  async generate(data: WordReportData): Promise<Buffer> {
    const {
      Document, Packer, Paragraph, Table, TableRow, TableCell,
      TextRun, AlignmentType, WidthType, BorderStyle, ShadingType,
      Header, Footer, PageNumber, UnderlineType, ImageRun, VerticalAlign,
    } = require('docx');

    // O'zbekiston gerbini yuklab olamiz
    let emblemBuffer: Buffer | null = null;
    try {
      const https = require('https');
      emblemBuffer = await new Promise<Buffer>((resolve, reject) => {
        https.get(
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Emblem_of_Uzbekistan.svg/100px-Emblem_of_Uzbekistan.svg.png',
          (res: any) => {
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
          }
        ).on('error', reject);
      });
    } catch { emblemBuffer = null; }

    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const period = `${fmt(sixMonthsAgo)} – ${fmt(today)}`;
    const generatedAt = today.toLocaleDateString('ru-RU', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const recentNotes = data.notes.filter(n => new Date(n.createdAt) >= sixMonthsAgo);

    const typeStats: Record<string, number> = {};
    recentNotes.forEach(n => {
      typeStats[n.type] = (typeStats[n.type] ?? 0) + 1;
    });

    const dangerStudents = data.students.filter(s => s.level === 'danger');
    const attentionStudents = data.students.filter(s => s.level === 'attention');

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

    function run(text: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean; underline?: boolean } = {}) {
      return new TextRun({
        text, font: FONT, size: opts.size ?? 22, bold: opts.bold,
        color: opts.color, italics: opts.italics,
        underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
      });
    }

    function p(children: unknown[], spacing?: { before?: number; after?: number }, align?: string) {
      return new Paragraph({
        children,
        spacing: { before: spacing?.before ?? 80, after: spacing?.after ?? 80 },
        alignment: align,
      });
    }

    function secHeader(text: string) {
      return new Paragraph({
        children: [new TextRun({ text, font: FONT, size: 28, bold: true, underline: { type: UnderlineType.SINGLE } })],
        spacing: { before: 320, after: 160 },
      });
    }

    function cell(text: string, isHeader = false, width = 2000) {
      return new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: isHeader ? { type: ShadingType.CLEAR, fill: '1e3a5f' } : undefined,
        borders: CELL_BORDER,
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text, bold: isHeader, color: isHeader ? 'FFFFFF' : '000000', size: 20, font: FONT })],
        })],
      });
    }

    function noBorderCell(children: unknown[], width = 4500) {
      return new TableCell({ width: { size: width, type: WidthType.DXA }, borders: NO_BORDER, children });
    }

    const doc = new Document({
      sections: [{
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [run(`${data.district}, ${data.school}`, { size: 18, color: '666666' })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                run('Sahifa ', { size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: FONT }),
                run('  |  Maxfiy — faqat xizmat uchun', { size: 18, color: '999999' }),
              ],
            })],
          }),
        },
        children: [
          // ════ SARLAVHA — gerb + vazirlik nomi ════
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [new TableRow({ children: [
              new TableCell({
                width: { size: 1400, type: WidthType.DXA },
                borders: NO_BORDER,
                verticalAlign: VerticalAlign.CENTER,
                children: emblemBuffer ? [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new ImageRun({ data: emblemBuffer, transformation: { width: 85, height: 95 } })] })] : [],
              }),
              new TableCell({
                width: { size: 7600, type: WidthType.DXA },
                borders: NO_BORDER,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  p([run("O'ZBEKISTON RESPUBLIKASI MAKTABGACHA", { bold: true, size: 22 })], { before: 0, after: 30 }),
                  p([run("VA MAKTAB TA'LIMI VAZIRLIGI", { bold: true, size: 22 })], { before: 0, after: 60 }),
                  p([run(`Namangan viloyati ${data.district}ga qarashli`, { size: 20 })], { before: 0, after: 20 }),
                  p([run(`${data.school} maktab psixologi`, { bold: true, size: 20 })], { before: 0, after: 0 }),
                ],
              }),
            ]})],
          }),
          new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),
          p([run('HISOBOT', { bold: true, size: 36 })], { before: 0, after: 60 }, AlignmentType.CENTER),
          p([run("O'quvchilarning psixologik holati va xavf guruhlariga oid", { bold: true, size: 24 })], { before: 0, after: 60 }, AlignmentType.CENTER),
          p([run(`Hisobot davri: ${period}`, { italics: true })], { before: 0, after: 400 }, AlignmentType.CENTER),

          // ════ 1. UMUMIY MA'LUMOT ════
          secHeader("1. Umumiy ma'lumot"),
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
          secHeader("2. Risk darajasi bo'yicha tahlil"),
          p([run("AI tizimi (Claude Sonnet) tomonidan o'tkazilgan psixologik tahlil natijalari:", { bold: true })]),
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

          // ════ 3. YUQORI XAVF ════
          secHeader("3. Yuqori xavf guruhi o'quvchilari va AI tahlili"),
          ...(dangerStudents.length === 0
            ? [p([run("Yuqori xavf darajasidagi o'quvchi aniqlanmagan.")])]
            : [
              p([run(`Quyida yuqori xavf (DANGER) darajasi aniqlangan ${dangerStudents.length} nafar o'quvchi ro'yxati:`)]),
              new Table({
                width: { size: 9000, type: WidthType.DXA },
                rows: [
                  new TableRow({ children: [cell('Nr', true, 600), cell('F.I.O.', true, 2200), cell('Sinf', true, 700), cell('AI xulosasi', true, 5500)] }),
                  ...dangerStudents.map((s, i) => new TableRow({ children: [cell(`${i + 1}`), cell(s.fullName), cell(s.className), cell(s.aiInsight ?? '—')] })),
                ],
              }),
            ]
          ),

          // ════ 4. ISH JURNALI ════
          secHeader(`4. Psixolog ishi jurnali (so'nggi 6 oy)`),
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
                  new TableRow({ children: [cell('Sana', true, 1100), cell("O'quvchi", true, 1900), cell('Sinf', true, 700), cell('Ish turi', true, 1800), cell('Amalga oshirilgan ish', true, 2300), cell('Keyingi qadam', true, 1200)] }),
                  ...recentNotes.map(n => {
                    const name = n.student ? `${n.student.firstName} ${n.student.lastName ?? ''}`.trim() : '—';
                    return new TableRow({ children: [cell(fmt(n.createdAt)), cell(name), cell(n.student?.className ?? '—'), cell(TYPE_LABELS[n.type] ?? n.type), cell(n.note), cell(n.nextStep ?? '—')] });
                  }),
                ],
              }),
            ]
          ),

          // ════ 5. XULOSA ════
          secHeader('5. Xulosa va tavsiyalar'),
          p([run('Umumiy xulosa:', { bold: true })]),
          p([run(
            `${data.district} ${data.school} maktabida o'tkazilgan AI asosidagi psixologik tahlil natijalari shuni ko'rsatadiki, ` +
            `${data.total} nafar noyob o'quvchidan ${data.danger} nafari (${pct(data.danger, data.total)}) yuqori xavf guruhiga kiradi. ` +
            `Ushbu o'quvchilar bilan zudlik bilan ishlash tavsiya etiladi.`
          )]),
          p([run("Tavsiyalar:", { bold: true })], { before: 160, after: 80 }),
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
              new TableRow({ children: [noBorderCell([p([run('Maktab psixologi:', { bold: true })])]), noBorderCell([p([run('________________ / ________________')])])] }),
              new TableRow({ children: [noBorderCell([p([run('Sana:', { bold: true })])]), noBorderCell([p([run(generatedAt)])])] }),
            ],
          }),
        ],
      }],
    });

    return Packer.toBuffer(doc) as Promise<Buffer>;
  }
}

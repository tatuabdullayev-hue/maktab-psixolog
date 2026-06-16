import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { exportOverviewToExcel, formatDate, type Overview } from './Dashboard';
import { generateWordReport } from '../utils/generateWordReport';

interface NoteEntry {
  id: string;
  studentId: string;
  type: string;
  note: string;
  nextStep?: string | null;
  createdAt: string;
  student?: { firstName: string; lastName?: string; className?: string } | null;
}

export function Reports() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school] = useState('53-maktab');
  const [district] = useState('Chortoq tumani');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordLoading, setWordLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = { school, district };
    if (date) params.date = date;

    api
      .get('/dashboard/overview', { params })
      .then(({ data }) => setOverview(data))
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }, [school, district, date]);

  async function handleWordDownload() {
    if (!overview) return;
    setWordLoading(true);
    try {
      const params = { school, district };
      const { data: notes } = await api.get<NoteEntry[]>('/notes', { params });

      const danger = overview.students.filter(s => s.level === 'danger').length;
      const attention = overview.students.filter(s => s.level === 'attention').length;
      const normal = overview.students.filter(s => s.level === 'normal').length;

      await generateWordReport({
        school,
        district,
        total: overview.total,
        danger,
        attention,
        normal,
        students: overview.students.map(s => ({
          fullName: s.fullName,
          className: s.className,
          level: s.level,
          aiInsight: s.aiInsight ?? null,
          aiRecommendation: s.aiRecommendation ?? null,
          completedAt: s.completedAt,
        })),
        notes,
      });
    } catch {
      alert("Word hujjat yaratishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setWordLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <Topbar
        title="Hisobotlar"
        school={school}
        district={district}
        date={date}
        onSchoolChange={() => {}}
        onDistrictChange={() => {}}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Yuklanmoqda...</p>}
      {error && <p className="error">{error}</p>}

      {overview && (
        <>
          <div className="card placeholder-card">
            <h3>📊 Excel hisoboti</h3>
            <p className="muted">
              {date ? `${formatDate(date)} sanasi` : 'Barcha sanalar'} bo'yicha natijalarni Excel
              formatida yuklab oling.
            </p>
            <button
              type="button"
              className="btn btn-export"
              disabled={overview.students.length === 0}
              onClick={() => exportOverviewToExcel(overview, date)}
            >
              ⬇️ Excel formatda yuklab olish
            </button>
          </div>

          <div className="card placeholder-card" style={{ marginTop: 16 }}>
            <h3>📄 Rasmiy Word hisoboti</h3>
            <p className="muted" style={{ marginBottom: 12 }}>
              So'nggi 6 oy davomida <strong>{school}</strong>da olib borilgan ishlar bo'yicha
              rasmiy hisobot — AI tahlili, yuqori xavf guruhi, psixolog ish jurnali va
              tavsiyalar bilan. Word (.docx) formatda yuklab olinadi.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-export"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
                disabled={wordLoading || overview.students.length === 0}
                onClick={handleWordDownload}
              >
                {wordLoading ? '⏳ Yaratilmoqda...' : '📝 Word hujjat yuklab olish'}
              </button>
              <span className="muted" style={{ fontSize: 13 }}>
                Hisobot: {district}, {school} • Oxirgi 6 oy
              </span>
            </div>
            {overview.students.length === 0 && (
              <p className="muted" style={{ marginTop: 8, fontSize: 13, color: 'var(--color-danger)' }}>
                Ma'lumot yo'q — avval test natijalarini kiriting.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

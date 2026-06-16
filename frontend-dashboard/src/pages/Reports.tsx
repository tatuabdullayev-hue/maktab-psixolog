import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { exportOverviewToExcel, formatDate, type Overview } from './Dashboard';

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
    api
      .get('/dashboard/overview', { params: { school, district, date } })
      .then(({ data }) => setOverview(data))
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }, [school, district, date]);

  async function handleWordDownload() {
    setWordLoading(true);
    try {
      const response = await api.get('/dashboard/word-report', {
        params: { school, district },
        responseType: 'blob',
      });

      const today = new Date().toISOString().slice(0, 10);
      const filename = `Hisobot_${school}_${today}.docx`;

      const url = URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
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

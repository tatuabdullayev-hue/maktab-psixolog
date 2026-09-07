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
      .catch(() => setError("Failed to load data"))
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
      const filename = `Report_${school}_${today}.docx`;

      const url = URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate Word document. Please try again.");
    } finally {
      setWordLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <Topbar
        title="Reports"
        school={school}
        district={district}
        date={date}
        onSchoolChange={() => {}}
        onDistrictChange={() => {}}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {overview && (
        <>
          <div className="card placeholder-card">
            <h3>📊 Excel Report</h3>
            <p className="muted">
              Download results {date ? `for ${formatDate(date)}` : 'for all dates'} in Excel format.
            </p>
            <button
              type="button"
              className="btn btn-export"
              disabled={overview.students.length === 0}
              onClick={() => exportOverviewToExcel(overview, date)}
            >
              ⬇️ Download Excel
            </button>
          </div>

          <div className="card placeholder-card" style={{ marginTop: 16 }}>
            <h3>📄 Official Word Report</h3>
            <p className="muted" style={{ marginBottom: 12 }}>
              Official report for the last 6 months at <strong>{school}</strong> — includes AI analysis,
              high-risk group, psychologist work journal, and recommendations. Downloaded as Word (.docx).
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-export"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
                disabled={wordLoading || overview.students.length === 0}
                onClick={handleWordDownload}
              >
                {wordLoading ? '⏳ Generating...' : '📝 Download Word Document'}
              </button>
              <span className="muted" style={{ fontSize: 13 }}>
                Report: {district}, {school} • Last 6 months
              </span>
            </div>
            {overview.students.length === 0 && (
              <p className="muted" style={{ marginTop: 8, fontSize: 13, color: 'var(--color-danger)' }}>
                No data — please enter test results first.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

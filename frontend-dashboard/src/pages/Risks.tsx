import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { LEVEL_LABELS, formatDate, type Overview } from './Dashboard';

type LevelFilter = 'all' | 'normal' | 'attention' | 'danger';

const PAGE_SIZE = 10;

export function Risks() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school, setSchool] = useState(user?.schoolName ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;
    if (date) params.date = date;

    api
      .get('/dashboard/overview', { params })
      .then(({ data }) => setOverview(data))
      .finally(() => setLoading(false));
  }, [school, district, date]);

  const students = overview?.students ?? [];
  const filtered = students.filter((s) => {
    if (level !== 'all' && s.level !== level) return false;
    if (search.trim() && !s.fullName.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, level, school, district, date]);

  return (
    <div className="dashboard">
      <Topbar
        title="Risklar"
        school={school}
        district={district}
        date={date}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Yuklanmoqda...</p>}

      {overview && (
        <div className="card">
          <div className="card__header-row">
            <h2>Xavf darajalari ({filtered.length})</h2>
            <input
              className="topbar__input search-input"
              placeholder="Ism bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="chart-legend" style={{ justifyContent: 'flex-start', marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            {(['all', 'normal', 'attention', 'danger'] as LevelFilter[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                className="pagination__btn"
                style={level === lvl ? { background: 'var(--color-hover)', borderColor: 'var(--color-accent)' } : undefined}
                onClick={() => setLevel(lvl)}
              >
                {lvl === 'all' ? 'Hammasi' : LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="muted">O'quvchilar topilmadi</p>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>O'quvchi</th>
                    <th>Sinf</th>
                    <th>Daraja</th>
                    <th>AI tahlili</th>
                    <th>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, i) => (
                    <tr key={`${s.id}-${s.completedAt}-${i}`}>
                      <td className="data-table__index">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td>{s.fullName}</td>
                      <td>{s.className}</td>
                      <td>
                        <span className={`badge badge--${s.level}`}>{LEVEL_LABELS[s.level]}</span>
                      </td>
                      <td>{s.aiInsight}</td>
                      <td>{formatDate(s.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="pagination__btn"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ← Oldingi
                  </button>
                  <span className="pagination__info">
                    {currentPage} / {totalPages} ({filtered.length} ta)
                  </span>
                  <button
                    type="button"
                    className="pagination__btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Keyingi →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

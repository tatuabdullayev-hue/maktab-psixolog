import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { NoteModal, TYPE_LABELS } from '../components/NoteModal';
import type { Note } from '../components/NoteModal';

interface TestStudent {
  id: string;
  fullName: string;
  className: string;
  level: 'normal' | 'attention' | 'danger';
  aiInsight: string | null;
  aiRecommendation: string | null;
  completedAt: string;
}

interface Overview {
  total: number;
  students: TestStudent[];
}

const LEVEL_LABELS: Record<string, string> = {
  normal: 'Past xavf',
  attention: "O'rta xavf",
  danger: 'Yuqori xavf',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

const PAGE_SIZE = 10;

export function Students() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school, setSchool] = useState('53-maktab');
  const [district, setDistrict] = useState('Chortoq tumani');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string; className?: string } | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;
    if (date) params.date = date;

    api
      .get('/dashboard/overview', { params })
      .then(({ data }) => setOverview(data))
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }, [school, district, date]);

  const loadNotes = () => {
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;
    api.get('/notes', { params }).then(({ data }) => setAllNotes(data));
  };

  useEffect(() => { loadNotes(); }, [school, district]);

  const students = overview?.students ?? [];
  const filtered = search.trim()
    ? students.filter((s) =>
        s.fullName.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : students;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, school, district, date]);

  return (
    <div className="dashboard">
      <Topbar
        title="O'quvchilar"
        school={school}
        district={district}
        date={date}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Yuklanmoqda...</p>}
      {error && <p className="error">{error}</p>}

      {overview && (
        <>
          <div className="card">
            <div className="card__header-row">
              <h2>Test topshirgan o'quvchilar ({filtered.length})</h2>
              <input
                className="topbar__input search-input"
                placeholder="Ism bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                      <th>Sana</th>
                      <th>Ish</th>
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
                        <td>{formatDate(s.completedAt)}</td>
                        <td>
                          {s.level === 'danger' && (
                            <button
                              type="button"
                              className="btn-note"
                              onClick={() => setNoteTarget({ id: s.id, name: s.fullName, className: s.className })}
                            >
                              📝 Ish qo'shish
                            </button>
                          )}
                        </td>
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

          <div className="card">
            <h2>Psixolog ishi jurnali</h2>
            <p className="chart-card__subtitle">Barcha sanalar bo'yicha qilingan ishlar</p>
            {allNotes.length === 0 ? (
              <p className="muted">Hali hech qanday ish kiritilmagan</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>O'quvchi</th>
                    <th>Sinf</th>
                    <th>Ish turi</th>
                    <th>Tavsif</th>
                    <th>Keyingi qadam</th>
                  </tr>
                </thead>
                <tbody>
                  {allNotes.map((n) => (
                    <tr key={n.id}>
                      <td>{new Date(n.createdAt).toLocaleDateString('uz-UZ')}</td>
                      <td>
                        {n.student
                          ? `${n.student.firstName} ${n.student.lastName ?? ''}`
                          : '—'}
                      </td>
                      <td>{n.student?.className ?? '—'}</td>
                      <td>{TYPE_LABELS[n.type] ?? n.type}</td>
                      <td>{n.note}</td>
                      <td>{n.nextStep ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {noteTarget && (
        <NoteModal
          studentId={noteTarget.id}
          studentName={noteTarget.name}
          studentClass={noteTarget.className}
          onClose={() => setNoteTarget(null)}
          onSaved={loadNotes}
        />
      )}
    </div>
  );
}

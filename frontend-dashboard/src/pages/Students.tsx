import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { NoteModal } from '../components/NoteModal';
import { useNotifications } from '../context/NotificationContext';

interface TestStudent {
  id: string;
  fullName: string;
  className: string;
  level: 'normal' | 'attention' | 'danger';
  aiInsight: string | null;
  aiRecommendation: string | null;
  completedAt: string;
  photoBase64: string | null;
}

interface Overview {
  total: number;
  students: TestStudent[];
}

const LEVEL_LABELS: Record<string, string> = {
  normal: 'Low Risk',
  attention: 'Medium Risk',
  danger: 'High Risk',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

const PAGE_SIZE = 10;

function PhotoCell({ photo, name }: { photo: string | null; name: string }) {
  const [open, setOpen] = useState(false);

  if (!photo) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        👤
      </div>
    );
  }

  return (
    <>
      <div
        style={{ position: 'relative', width: 36, height: 36, cursor: 'pointer' }}
        onClick={() => setOpen(true)}
        title="View photo"
      >
        <img
          src={photo}
          alt={name}
          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.15s',
        }}
          className="photo-eye-overlay"
        >
          <span style={{ fontSize: 14 }}>👁️</span>
        </div>
      </div>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setOpen(false)}
        >
          <div style={{ position: 'relative', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={photo}
              alt={name}
              style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
            />
            <p style={{ color: '#fff', marginTop: 12, fontSize: 16, fontWeight: 600 }}>{name}</p>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: 8, padding: '8px 24px', borderRadius: 8,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14,
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function Students() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school, setSchool] = useState('53-maktab');
  const [district, setDistrict] = useState('Chortoq tumani');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string; className?: string } | null>(null);
  const { refresh: refreshBadge } = useNotifications();

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
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, [school, district, date]);

  const loadNotes = () => {};

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
      <style>{`.photo-thumb:hover .photo-eye-overlay { opacity: 1 !important; }`}</style>

      <Topbar
        title="Students"
        school={school}
        district={district}
        date={date}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {overview && (
        <>
          <div className="card">
            <div className="card__header-row">
              <h2>Students who completed the test ({filtered.length})</h2>
              <input
                className="topbar__input search-input"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <p className="muted">No students found</p>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Photo</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Level</th>
                      <th>AI Analysis</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s, i) => (
                      <tr key={`${s.id}-${s.completedAt}-${i}`}>
                        <td className="data-table__index">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                        <td>
                          <div
                            className="photo-thumb"
                            style={{ position: 'relative', width: 36, height: 36, cursor: s.photoBase64 ? 'pointer' : 'default' }}
                          >
                            <PhotoCell photo={s.photoBase64} name={s.fullName} />
                          </div>
                        </td>
                        <td>{s.fullName}</td>
                        <td>{s.className}</td>
                        <td>
                          <span className={`badge badge--${s.level}`}>{LEVEL_LABELS[s.level]}</span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 320 }}>
                          {s.aiInsight ?? '—'}
                        </td>
                        <td>{formatDate(s.completedAt)}</td>
                        <td>
                          {s.level === 'danger' && (
                            <button
                              type="button"
                              className="btn-note"
                              onClick={() => setNoteTarget({ id: s.id, name: s.fullName, className: s.className })}
                            >
                              📝 Add Action
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
                      ← Previous
                    </button>
                    <span className="pagination__info">
                      {currentPage} / {totalPages} ({filtered.length} total)
                    </span>
                    <button
                      type="button"
                      className="pagination__btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
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
          onSaved={() => { loadNotes(); refreshBadge(); }}
        />
      )}
    </div>
  );
}

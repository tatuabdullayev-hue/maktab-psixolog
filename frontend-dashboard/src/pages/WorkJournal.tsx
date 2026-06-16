import { useEffect, useState } from 'react';
import '../wj.css';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { NoteModal } from '../components/NoteModal';
import type { Note } from '../components/NoteModal';
import { useNotifications } from '../context/NotificationContext';

const TYPE_LABELS: Record<string, string> = {
  student_talk: "O'quvchi bilan suhbat",
  parent_talk: 'Ota-ona bilan suhbat',
  teacher_talk: 'Sinf rahbari bilan suhbat',
  other: 'Boshqa kuzatuv',
};

const TYPE_ICONS: Record<string, string> = {
  student_talk: '💬',
  parent_talk: '👨‍👩‍👧',
  teacher_talk: '🏫',
  other: '📋',
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  student_talk: { bg: '#ede9fe', text: '#6d4ce0' },
  parent_talk:  { bg: '#fef3c7', text: '#d97706' },
  teacher_talk: { bg: '#dcfce7', text: '#16a34a' },
  other:        { bg: '#e0f2fe', text: '#0369a1' },
};

interface UnattendedStudent {
  studentId: string;
  fullName: string;
  className: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const PAGE_SIZE = 15;

export function WorkJournal() {
  const [notes, setNotes]           = useState<Note[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [school]                    = useState('53-maktab');
  const [district]                  = useState('Chortoq tumani');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string; className?: string } | null>(null);

  const [unattended, setUnattended]           = useState<UnattendedStudent[]>([]);
  const [unattendedLoading, setUnattendedLoading] = useState(true);
  const [showUnattended, setShowUnattended]   = useState(false);
  const [showInspector, setShowInspector]     = useState(false);

  const { unattended: cachedCount, refresh: refreshBadge } = useNotifications();

  const load = () => {
    setLoading(true);
    setError(null);
    api.get('/notes', { params: { school, district } })
      .then(({ data }) => setNotes(data))
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
      .finally(() => setLoading(false));
  };

  const loadUnattended = () => {
    setUnattendedLoading(true);
    api.get('/notes/unattended-students', { params: { school, district } })
      .then(({ data }) => setUnattended(data))
      .catch(() => {})
      .finally(() => setUnattendedLoading(false));
  };

  useEffect(() => { load(); loadUnattended(); }, []);

  const handleSaved = () => {
    load();
    loadUnattended();
    refreshBadge();
  };

  /* ── inspektora yuborilganlar ── */
  const inspectorNotes = notes.filter(n =>
    n.note.includes('Inspektor-psixologga yuborildi')
  );
  // har bir o'quvchidan bitta (oxirgi) yozuv
  const inspectorMap = new Map<string, Note>();
  for (const n of [...inspectorNotes].reverse()) {
    inspectorMap.set(n.studentId, n);
  }
  const inspectorStudents = Array.from(inspectorMap.values());

  /* ── filterlash ── */
  const filtered = notes.filter(n => {
    const typeOk = filterType === 'all' || n.type === filterType;
    const name = n.student
      ? `${n.student.firstName} ${n.student.lastName ?? ''}`
      : '';
    const searchOk = !search.trim() ||
      name.toLowerCase().includes(search.trim().toLowerCase()) ||
      n.note.toLowerCase().includes(search.trim().toLowerCase());
    return typeOk && searchOk;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filterType, search]);

  /* ── stats ── */
  const stats = Object.keys(TYPE_LABELS).map(t => ({
    type: t,
    count: notes.filter(n => n.type === t).length,
  }));

  return (
    <div className="dashboard">
      <Topbar
        title="Psixolog ish jurnali"
        school={school}
        district={district}
        date=""
        onSchoolChange={() => {}}
        onDistrictChange={() => {}}
        onDateChange={() => {}}
        hideDateFilter
      />

      {loading && <p className="muted">Yuklanmoqda...</p>}
      {error   && <p className="error">{error}</p>}

      {/* ── stat cards ── */}
      <div className="wj-stat-row">
        {/* Kiritilmagan ishlar — qizil karta */}
        <div
          className={`wj-stat wj-stat--danger${showUnattended ? ' wj-stat--danger-active' : ''}`}
          onClick={() => setShowUnattended(v => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setShowUnattended(v => !v)}
        >
          <span className="wj-stat__icon">⚠️</span>
          <span className="wj-stat__num wj-stat__num--red">
            {unattendedLoading ? cachedCount : unattended.length}
          </span>
          <span className="wj-stat__label">Kiritilmagan ishlar</span>
        </div>

        {/* Inspektora yuborilganlar — ko'k karta */}
        <div
          className={`wj-stat wj-stat--inspector${showInspector ? ' wj-stat--inspector-active' : ''}`}
          onClick={() => { setShowInspector(v => !v); setShowUnattended(false); setFilterType('all'); }}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setShowInspector(v => !v)}
        >
          <span className="wj-stat__icon">📤</span>
          <span className="wj-stat__num wj-stat__num--blue">{loading ? '—' : inspectorStudents.length}</span>
          <span className="wj-stat__label">Inspektora yuborildi</span>
        </div>

        <div className={`wj-stat${filterType === 'all' && !showUnattended && !showInspector ? ' wj-stat--active' : ''}`}
          onClick={() => { setFilterType('all'); setShowUnattended(false); setShowInspector(false); }}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setFilterType('all')}
        >
          <span className="wj-stat__num">{loading ? '—' : notes.length}</span>
          <span className="wj-stat__label">Jami yozuvlar</span>
        </div>

        {stats.map(s => {
          const c = TYPE_COLORS[s.type];
          return (
            <div
              key={s.type}
              className={`wj-stat${filterType === s.type ? ' wj-stat--active' : ''}`}
              style={filterType === s.type ? { borderColor: c.text, background: c.bg } : {}}
              onClick={() => { setFilterType(filterType === s.type ? 'all' : s.type); setShowUnattended(false); setShowInspector(false); }}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setFilterType(s.type)}
            >
              <span className="wj-stat__icon">{TYPE_ICONS[s.type]}</span>
              <span className="wj-stat__num" style={filterType === s.type ? { color: c.text } : {}}>{loading ? '—' : s.count}</span>
              <span className="wj-stat__label">{TYPE_LABELS[s.type]}</span>
            </div>
          );
        })}
      </div>

      {/* ── Kiritilmagan ishlar ro'yxati ── */}
      {showUnattended && (
        <div className="card wj-unattended-card">
          <div className="card__header-row">
            <h2 className="wj-unattended-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Ish kiritilmagan o'quvchilar
              <span className="wj-unattended-badge">{unattended.length} ta</span>
            </h2>
          </div>

          {unattended.length === 0 ? (
            <div className="wj-unattended-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <p>Barcha yuqori xavfli o'quvchilar uchun ish kiritilgan!</p>
            </div>
          ) : (
            <div className="wj-unattended-list">
              {unattended.map((s, idx) => (
                <div className="wj-unattended-item" key={s.studentId}>
                  <div className="wj-unattended-item__num">{idx + 1}</div>
                  <div className="wj-unattended-item__avatar">
                    {getInitials(s.fullName)}
                  </div>
                  <div className="wj-unattended-item__info">
                    <span className="wj-unattended-item__name">{s.fullName}</span>
                    {s.className && (
                      <span className="wj-unattended-item__class">{s.className}</span>
                    )}
                  </div>
                  <span className="wj-unattended-item__risk">Yuqori xavf</span>
                  <button
                    type="button"
                    className="wj-unattended-item__btn"
                    onClick={() => setNoteTarget({ id: s.studentId, name: s.fullName, className: s.className })}
                  >
                    + Ish qo'shish
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Inspektora yuborilganlar ro'yxati ── */}
      {showInspector && (
        <div className="card wj-unattended-card">
          <div className="card__header-row">
            <h2 className="wj-unattended-title" style={{ color: '#0369a1' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Inspektor-psixologga yuborilganlar
              <span className="wj-unattended-badge" style={{ background: '#0369a1' }}>{inspectorStudents.length} ta</span>
            </h2>
          </div>

          {inspectorStudents.length === 0 ? (
            <div className="wj-unattended-empty">
              <p className="muted">Hali hech kim inspektora yuborilmagan.</p>
            </div>
          ) : (
            <div className="wj-unattended-list">
              {inspectorStudents.map((n, idx) => {
                const name = n.student
                  ? `${n.student.firstName} ${n.student.lastName ?? ''}`.trim()
                  : '—';
                const cls = n.student?.className ?? '';
                return (
                  <div className="wj-unattended-item" key={n.studentId} style={{ borderColor: '#bae6fd' }}>
                    <div className="wj-unattended-item__num">{idx + 1}</div>
                    <div className="wj-unattended-item__avatar" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      {getInitials(name)}
                    </div>
                    <div className="wj-unattended-item__info">
                      <span className="wj-unattended-item__name">{name}</span>
                      {cls && <span className="wj-unattended-item__class">{cls}</span>}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(n.createdAt)}</span>
                    <span className="wj-unattended-item__risk" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                      📤 Yuborildi
                    </span>
                    <button
                      type="button"
                      className="wj-unattended-item__btn"
                      style={{ background: '#0369a1' }}
                      onClick={() => setNoteTarget({ id: n.studentId, name, className: cls })}
                    >
                      Ish jurnali
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── search + table ── */}
      {!showUnattended && !showInspector && (
        <div className="card">
          <div className="card__header-row">
            <h2>
              {filterType === 'all' ? 'Barcha ishlar' : TYPE_LABELS[filterType]}
              <span className="wj-count-badge">{filtered.length} ta</span>
            </h2>
            <input
              className="topbar__input search-input"
              placeholder="Ism yoki matn bo'yicha..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 && !loading ? (
            <div className="wj-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".3">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <p>Hali hech qanday ish kiritilmagan</p>
            </div>
          ) : (
            <>
              <div className="wj-list">
                {paginated.map((n, idx) => {
                  const c    = TYPE_COLORS[n.type] ?? TYPE_COLORS.other;
                  const name = n.student
                    ? `${n.student.firstName} ${n.student.lastName ?? ''}`
                    : '—';
                  const cls  = n.student?.className ?? '';
                  return (
                    <div className="wj-item" key={n.id}>
                      <div className="wj-item__left">
                        <div className="wj-item__num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</div>
                      </div>

                      <div className="wj-item__avatar" style={{ background: c.bg, color: c.text }}>
                        {getInitials(name)}
                      </div>

                      <div className="wj-item__body">
                        <div className="wj-item__top">
                          <button
                            className="wj-item__name"
                            type="button"
                            onClick={() => setNoteTarget({ id: n.studentId, name, className: cls })}
                          >
                            {name}
                            {cls && <span className="wj-item__class">{cls}</span>}
                          </button>
                          <span className="wj-item__chip" style={{ background: c.bg, color: c.text }}>
                            {TYPE_ICONS[n.type]} {TYPE_LABELS[n.type]}
                          </span>
                          <span className="wj-item__date">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {fmtDate(n.createdAt)}
                          </span>
                        </div>
                        <p className="wj-item__note">{n.note}</p>
                        {n.nextStep && (
                          <p className="wj-item__next">→ {n.nextStep}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="pagination__btn"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >← Oldingi</button>
                  <span className="pagination__info">
                    {currentPage} / {totalPages} ({filtered.length} ta)
                  </span>
                  <button
                    type="button"
                    className="pagination__btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >Keyingi →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {noteTarget && (
        <NoteModal
          studentId={noteTarget.id}
          studentName={noteTarget.name}
          studentClass={noteTarget.className}
          onClose={() => setNoteTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

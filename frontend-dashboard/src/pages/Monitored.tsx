import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { NoteModal } from '../components/NoteModal';
import { ReleaseModal } from '../components/ReleaseModal';
import { AddToMonitorModal } from '../components/AddToMonitorModal';
import { useNotifications } from '../context/NotificationContext';
import './monitored.css';

interface MonitoredStudent {
  id: string;
  fullName: string;
  className: string;
  dangerCount: number;
  lastDetected: string;
  lastInsight: string | null;
  lastRecommendation: string | null;
  allInsights: { date: string; insight: string | null }[];
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} • ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function initials(name: string) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}

function riskMeta(count: number): { label: string; cls: string } {
  if (count >= 3) return { label: 'YUQORI XAVF', cls: 'high' };
  if (count >= 2) return { label: "O'RTA XAVF", cls: 'mid' };
  return { label: 'PAST XAVF', cls: 'low' };
}

const AVATAR_COLORS = ['#6d4ce0','#e05c4c','#e0a84c','#4cae6d','#4c8ae0','#c04ce0'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const PAGE_SIZE = 10;

export function Monitored() {
  const [students, setStudents] = useState<MonitoredStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string; className: string } | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<MonitoredStudent | null>(null);
  const { refresh: refreshBadge } = useNotifications();

  const school = '53-maktab';
  const district = 'Chortoq tumani';

  function load() {
    setLoading(true);
    setError(null);
    api.get('/dashboard/monitored', { params: { school, district } })
      .then(({ data }) => setStudents(data))
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const classes = useMemo(() => [...new Set(students.map(s => s.className))].sort(), [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (search) list = list.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase()));
    if (filterClass) list = list.filter(s => s.className === filterClass);
    if (filterRisk === 'high') list = list.filter(s => s.dangerCount >= 3);
    else if (filterRisk === 'mid') list = list.filter(s => s.dangerCount === 2);
    else if (filterRisk === 'low') list = list.filter(s => s.dangerCount < 2);
    return list;
  }, [students, search, filterClass, filterRisk]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const totalKuzatuvlar = students.reduce((s, st) => s + st.allInsights.length, 0);
  const highCount = students.filter(s => s.dangerCount >= 3).length;

  function handleExport() {
    const rows = filtered.map((s, idx) => {
      const risk = riskMeta(s.dangerCount);
      const daysIn = daysSince(s.allInsights.length > 0
        ? s.allInsights[s.allInsights.length - 1].date
        : s.lastDetected);
      return {
        '№': idx + 1,
        "F.I.Sh": s.fullName,
        'Sinf': s.className,
        'Xavf darajasi': risk.label,
        'Aniqlangan marta': s.dangerCount,
        'Oxirgi aniqlangan': fmtDate(s.lastDetected),
        'Nazoratda (kun)': daysIn,
        'AI tavsiyasi': s.lastRecommendation || s.lastInsight || '—',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 4 }, { wch: 28 }, { wch: 10 }, { wch: 16 },
      { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 50 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ichki nazorat');
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Ichki_nazorat_53-maktab_${date}.xlsx`);
  }

  const now = new Date();
  const nowStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <div className="dashboard">
      <Topbar
        title="Ichki nazorat"
        school={school}
        district={district}
        date=""
        onSchoolChange={() => {}}
        onDistrictChange={() => {}}
        onDateChange={() => {}}
      />

      {/* Banner */}
      <div className="mon2-banner">
        <div className="mon2-banner__left">
          <div className="mon2-banner__icon">👁</div>
          <div>
            <div className="mon2-banner__title">Ichki nazoratdagi o'quvchilar</div>
            <div className="mon2-banner__sub">
              Quyida <strong>{students.length} nafar</strong> o'quvchi yuqori xavf (DANGER) darajasida aniqlangan.<br />
              Bu o'quvchilar doimiy psixologik yordam va monitoringni talab qiladi.
            </div>
          </div>
        </div>
        <div className="mon2-banner__chips">
          <div className="mon2-chip">
            <span className="mon2-chip__icon">🧠</span>
            <div>
              <div className="mon2-chip__label">AI Monitoring</div>
              <div className="mon2-chip__val mon2-chip__val--green">Faol</div>
            </div>
          </div>
          <div className="mon2-chip">
            <span className="mon2-chip__icon">📅</span>
            <div>
              <div className="mon2-chip__label">Oxirgi yangilanish</div>
              <div className="mon2-chip__val">{nowStr}</div>
            </div>
          </div>
          <div className="mon2-chip">
            <span className="mon2-chip__icon">🛡</span>
            <div>
              <div className="mon2-chip__label">Ma'lumotlar xavfsiz</div>
              <div className="mon2-chip__val">To'liq himoyalangan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mon2-stats">
        <div className="mon2-stat">
          <div className="mon2-stat__icon mon2-stat__icon--blue">👥</div>
          <div className="mon2-stat__num">{students.length}</div>
          <div className="mon2-stat__lbl">Nazoratdagi o'quvchilar</div>
          <div className="mon2-stat__bar mon2-stat__bar--blue" />
        </div>
        <div className="mon2-stat">
          <div className="mon2-stat__icon mon2-stat__icon--red">⚠</div>
          <div className="mon2-stat__num">{highCount}+</div>
          <div className="mon2-stat__lbl">Takrorlangan yuqori xavf</div>
          <div className="mon2-stat__bar mon2-stat__bar--red" />
        </div>
        <div className="mon2-stat">
          <div className="mon2-stat__icon mon2-stat__icon--orange">📋</div>
          <div className="mon2-stat__num">{totalKuzatuvlar}</div>
          <div className="mon2-stat__lbl">Kiritilgan kuzatuvlar</div>
          <div className="mon2-stat__bar mon2-stat__bar--orange" />
        </div>
        <div className="mon2-stat">
          <div className="mon2-stat__icon mon2-stat__icon--purple">👤</div>
          <div className="mon2-stat__num">{students.length}</div>
          <div className="mon2-stat__lbl">Faol ishlar</div>
          <div className="mon2-stat__bar mon2-stat__bar--purple" />
        </div>
        <div className="mon2-stat">
          <div className="mon2-stat__icon mon2-stat__icon--green">📈</div>
          <div className="mon2-stat__num">—</div>
          <div className="mon2-stat__lbl">Holat yaxshilanish ko'rsatkichi</div>
          <div className="mon2-stat__bar mon2-stat__bar--green" />
        </div>
      </div>

      {/* Filters */}
      <div className="mon2-filters">
        <div className="mon2-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            placeholder="Ism bo'yicha qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="mon2-select" value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }}>
          <option value="">Sinf bo'yicha</option>
          {classes.map(c => <option key={c} value={c}>{c} sinf</option>)}
        </select>
        <select className="mon2-select" value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(1); }}>
          <option value="">Xavf darajasi</option>
          <option value="high">Yuqori xavf (3X+)</option>
          <option value="mid">O'rta xavf (2X)</option>
          <option value="low">Past xavf (1X)</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="mon2-add-btn" onClick={() => setShowAddModal(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Qo'shish
        </button>
        <button className="mon2-export-btn" onClick={handleExport}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Eksport
        </button>
      </div>

      {loading && <p className="muted" style={{ padding: '24px' }}>Yuklanmoqda...</p>}
      {error && <p style={{ padding: '24px', color: '#e53e3e' }}>{error}</p>}

      {!loading && !error && students.length === 0 && (
        <div className="mon2-empty">
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Ichki nazorat bo'sh</p>
          <p style={{ color: 'var(--color-text-muted)' }}>Hozircha yuqori xavf aniqlangan o'quvchi yo'q.</p>
        </div>
      )}

      {/* Student rows */}
      {!loading && pageItems.length > 0 && (
        <div className="mon2-list">
          {pageItems.map((s, idx) => {
            const risk = riskMeta(s.dangerCount);
            const daysIn = daysSince(s.allInsights.length > 0
              ? s.allInsights[s.allInsights.length - 1].date
              : s.lastDetected);
            const color = avatarColor(s.id);
            const shortId = `ST-${new Date(s.lastDetected).getFullYear()}-${String((page-1)*PAGE_SIZE + idx + 1).padStart(3,'0')}`;
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} className={`mon2-row-wrap${isOpen ? ' mon2-row-wrap--open' : ''}`}>
              <div className="mon2-row" onClick={() => setExpanded(isOpen ? null : s.id)} style={{ cursor: 'pointer' }}>
                {/* Badge */}
                <div className={`mon2-badge mon2-badge--${risk.cls}`}>
                  <div className="mon2-badge__num">{s.dangerCount}X</div>
                  <div className="mon2-badge__lbl">{risk.label}</div>
                </div>

                {/* Avatar */}
                <div className="mon2-avatar" style={{ background: color }}>
                  {initials(s.fullName)}
                </div>

                {/* Info */}
                <div className="mon2-info">
                  <div className="mon2-info__name">{s.fullName}</div>
                  <div className="mon2-info__meta">
                    {s.className} sinf &nbsp;•&nbsp; ID: {shortId}
                  </div>
                  <div className="mon2-info__tag">O'quvchi</div>
                </div>

                {/* Date */}
                <div className="mon2-date">
                  <div className="mon2-date__label">Oxirgi aniqlangan</div>
                  <div className="mon2-date__val">{fmtDate(s.lastDetected)}</div>
                  <div className={`mon2-days mon2-days--${risk.cls}`}>Ichki nazoratda: {daysIn} kun</div>
                </div>

                {/* AI */}
                <div className="mon2-ai">
                  <div className="mon2-ai__label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    AI tavsiyasi
                  </div>
                  <div className="mon2-ai__text">
                    {s.lastRecommendation || s.lastInsight || 'AI tahlili mavjud emas'}
                  </div>
                </div>

                {/* Actions */}
                <div className="mon2-actions">
                  <button
                    className="mon2-btn mon2-btn--note"
                    onClick={e => { e.stopPropagation(); setNoteTarget({ id: s.id, name: s.fullName, className: s.className }); }}
                  >
                    Ish qo'shish
                  </button>
                  <button
                    className="mon2-btn mon2-btn--release"
                    onClick={e => { e.stopPropagation(); setReleaseTarget(s); }}
                  >
                    Nazoratdan chiqarish
                  </button>
                </div>

                {/* Chevron */}
                <div className={`mon2-chevron${isOpen ? ' mon2-chevron--open' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              {/* Expanded: barcha natijalar */}
              {isOpen && (
                <div className="mon2-history">
                  <div className="mon2-history__title">
                    📊 Barcha DANGER natijalari — {s.dangerCount} ta holat
                  </div>
                  <div className="mon2-history__list">
                    {s.allInsights.map((item, i) => (
                      <div key={i} className="mon2-history__item">
                        <div className="mon2-history__num">{i + 1}</div>
                        <div className="mon2-history__date">{fmtDate(item.date)}</div>
                        <div className="mon2-history__text">{item.insight || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mon2-pagination">
          <span className="mon2-pagination__total">Jami {filtered.length} nafar o'quvchi</span>
          <div className="mon2-pagination__pages">
            <button
              className="mon2-pagination__arrow"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`mon2-pagination__num${p === page ? ' mon2-pagination__num--active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button
              className="mon2-pagination__arrow"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >›</button>
          </div>
          <div className="mon2-pagination__size">
            {PAGE_SIZE} / sahifada
          </div>
        </div>
      )}

      {showAddModal && (
        <AddToMonitorModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { load(); refreshBadge(); }}
        />
      )}

      {noteTarget && (
        <NoteModal
          studentId={noteTarget.id}
          studentName={noteTarget.name}
          studentClass={noteTarget.className}
          onClose={() => setNoteTarget(null)}
          onSaved={() => { load(); refreshBadge(); }}
        />
      )}

      {releaseTarget && (
        <ReleaseModal
          studentId={releaseTarget.id}
          studentName={releaseTarget.fullName}
          className={releaseTarget.className}
          dangerCount={releaseTarget.dangerCount}
          noteCount={releaseTarget.allInsights.length}
          onClose={() => setReleaseTarget(null)}
          onReleased={() => { load(); refreshBadge(); }}
        />
      )}
    </div>
  );
}

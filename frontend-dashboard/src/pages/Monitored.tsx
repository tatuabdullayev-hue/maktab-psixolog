import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { NoteModal } from '../components/NoteModal';
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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function Monitored() {
  const [students, setStudents] = useState<MonitoredStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string; className: string } | null>(null);
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

      {/* Izoh banner */}
      <div className="mon-banner">
        <div className="mon-banner__icon">👁</div>
        <div>
          <div className="mon-banner__title">Ichki nazoratdagi o'quvchilar</div>
          <div className="mon-banner__sub">
            Quyida <strong>2 va undan ko'p marta</strong> yuqori xavf (DANGER) darajasi aniqlangan
            o'quvchilar ko'rsatilgan. Bu o'quvchilar maxsus kuzatuv va doimiy psixologik yordamga muhtoj.
          </div>
        </div>
      </div>

      {loading && <p className="muted" style={{ padding: '24px' }}>Yuklanmoqda...</p>}
      {error && <p className="error" style={{ padding: '24px' }}>{error}</p>}

      {!loading && !error && students.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Ichki nazorat bo'sh</p>
          <p className="muted">Hozircha 2 va undan ko'p marta yuqori xavf aniqlangan o'quvchi yo'q.</p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="card">
          <div className="card__header-row">
            <h2>Nazorat ro'yxati ({students.length} nafar)</h2>
          </div>

          <div className="mon-list">
            {students.map(s => (
              <div key={s.id} className={`mon-card${expanded === s.id ? ' mon-card--open' : ''}`}>
                {/* Asosiy qator */}
                <div className="mon-card__head" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  <div className="mon-card__danger-badge">{s.dangerCount}✕</div>
                  <div className="mon-card__info">
                    <div className="mon-card__name">{s.fullName}</div>
                    <div className="mon-card__meta">
                      {s.className} sinf &nbsp;•&nbsp; Oxirgi aniqlangan: {fmt(s.lastDetected)}
                    </div>
                  </div>
                  <div className="mon-card__actions">
                    <button
                      type="button"
                      className="btn-note"
                      onClick={e => { e.stopPropagation(); setNoteTarget({ id: s.id, name: s.fullName, className: s.className }); }}
                    >
                      📝 Ish qo'shish
                    </button>
                    <span className="mon-card__chevron">{expanded === s.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Kengaytirilgan qism */}
                {expanded === s.id && (
                  <div className="mon-card__body">
                    {s.lastInsight && (
                      <div className="mon-card__section">
                        <div className="mon-card__section-label">Oxirgi AI xulosasi</div>
                        <div className="mon-card__text">{s.lastInsight}</div>
                      </div>
                    )}
                    {s.lastRecommendation && (
                      <div className="mon-card__section">
                        <div className="mon-card__section-label">Psixolog uchun tavsiya</div>
                        <div className="mon-card__text mon-card__text--rec">{s.lastRecommendation}</div>
                      </div>
                    )}
                    <div className="mon-card__section">
                      <div className="mon-card__section-label">Barcha DANGER natijalari</div>
                      <div className="mon-card__history">
                        {s.allInsights.map((item, idx) => (
                          <div key={idx} className="mon-card__history-item">
                            <span className="mon-card__history-date">{fmt(item.date)}</span>
                            <span className="mon-card__history-text">{item.insight ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
    </div>
  );
}

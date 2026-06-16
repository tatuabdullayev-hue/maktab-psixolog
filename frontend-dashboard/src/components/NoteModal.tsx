import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

export interface Note {
  id: string;
  studentId: string;
  type: string;
  note: string;
  nextStep: string | null;
  createdAt: string;
  student?: { firstName: string; lastName: string; className: string };
}

export const TYPE_LABELS: Record<string, string> = {
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

const TYPE_COLORS: Record<string, string> = {
  student_talk: '#6d4ce0',
  parent_talk: '#f59e0b',
  teacher_talk: '#22c55e',
  other: '#06b6d4',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface Props {
  studentId: string;
  studentName: string;
  studentClass?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteModal({ studentId, studentName, studentClass, onClose, onSaved }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [type, setType] = useState('student_talk');
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const load = () =>
    api.get('/notes', { params: { studentId } }).then(({ data }) => setNotes(data));

  useEffect(() => { load(); }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    await api.post('/notes', {
      studentId,
      type,
      note: note.trim(),
      nextStep: nextStep.trim() || undefined,
    });
    setNote('');
    setNextStep('');
    setSaving(false);
    load();
    onSaved();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await api.delete(`/notes/${id}`);
    setDeleting(null);
    load();
    onSaved();
  };

  return (
    <div
      className="nm-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="nm-modal">
        {/* Header */}
        <div className="nm-header">
          <div className="nm-avatar">{getInitials(studentName)}</div>
          <div className="nm-header__info">
            <div className="nm-header__name">{studentName}</div>
            {studentClass && <div className="nm-header__class">{studentClass}-sinf o'quvchisi</div>}
          </div>
          <div className="nm-header__tag">
            <span>📋</span> Ish jurnali
          </div>
          <button type="button" className="nm-close" onClick={onClose}>✕</button>
        </div>

        {/* Form */}
        <div className="nm-form-wrap">
          <form className="nm-form" onSubmit={handleSubmit}>
            {/* Type selector with icon */}
            <div className="nm-type-row">
              <span className="nm-type-icon" style={{ background: TYPE_COLORS[type] + '22', color: TYPE_COLORS[type] }}>
                {TYPE_ICONS[type]}
              </span>
              <span className="nm-type-label" style={{ color: TYPE_COLORS[type] }}>
                {TYPE_LABELS[type]}
              </span>
            </div>

            <div className="nm-select-wrap">
              <select
                className="nm-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <span className="nm-select-arrow">▾</span>
            </div>

            <div className="nm-textarea-wrap">
              <textarea
                className="nm-textarea"
                placeholder="Qilgan ish, kuzatuvlar..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                required
              />
              <span className="nm-textarea-icon">✏️</span>
            </div>

            <div className="nm-input-wrap">
              <span className="nm-input-icon">📅</span>
              <input
                className="nm-input"
                placeholder="Keyingi qadam (ixtiyoriy)"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
              />
            </div>

            <button type="submit" className="nm-btn" disabled={saving || !note.trim()}>
              {saving ? 'Saqlanmoqda...' : '📨 Saqlash'}
            </button>
          </form>

          {/* Illustration */}
          <div className="nm-illustration" aria-hidden>
            <svg width="120" height="130" viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="10" width="80" height="100" rx="12" fill="#ede9fe" />
              <rect x="30" y="22" width="60" height="8" rx="4" fill="#c4b5fd" />
              <rect x="30" y="38" width="45" height="6" rx="3" fill="#ddd6fe" />
              <rect x="30" y="52" width="50" height="6" rx="3" fill="#ddd6fe" />
              <circle cx="36" cy="72" r="8" fill="#6d4ce0" />
              <path d="M31 72l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="36" cy="90" r="8" fill="#a78bfa" />
              <path d="M31 90l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="90" cy="20" r="14" fill="#6d4ce0" opacity="0.15"/>
              <circle cx="10" cy="90" r="8" fill="#a78bfa" opacity="0.2"/>
            </svg>
          </div>
        </div>

        {/* History */}
        <div className="nm-history">
          <div className="nm-history__header">
            <span className="nm-history__title">🕐 ISH TARIXI</span>
            <span className="nm-history__count">{notes.length} ta yozuv</span>
          </div>

          {notes.length === 0 ? (
            <p className="nm-empty">Hali hech qanday ish kiritilmagan</p>
          ) : (
            <div className="nm-timeline">
              {notes.map((n, idx) => (
                <div className="nm-timeline-item" key={n.id}>
                  <div className="nm-timeline-dot" style={{ background: idx === 0 ? TYPE_COLORS[n.type] : 'transparent', borderColor: TYPE_COLORS[n.type] }} />
                  <div className="nm-timeline-line" style={{ background: idx < notes.length - 1 ? '#e5e7eb' : 'transparent' }} />
                  <div className="nm-timeline-content">
                    <div className="nm-timeline-top">
                      <span
                        className="nm-timeline-type"
                        style={{ background: TYPE_COLORS[n.type] + '18', color: TYPE_COLORS[n.type] }}
                      >
                        {TYPE_ICONS[n.type]} {TYPE_LABELS[n.type]}
                      </span>
                      <span className="nm-timeline-date">📅 {formatDate(n.createdAt)}</span>
                      <button
                        type="button"
                        className="nm-timeline-del"
                        disabled={deleting === n.id}
                        onClick={() => handleDelete(n.id)}
                        title="O'chirish"
                      >
                        ⋮
                      </button>
                    </div>
                    <p className="nm-timeline-note">{n.note}</p>
                    {n.nextStep && (
                      <p className="nm-timeline-next">— {n.nextStep}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="nm-footer">
          <span>🔒</span>
          <span>Barcha suhbatlar va kuzatuvlar maxfiy saqlanadi.</span>
        </div>
      </div>
    </div>
  );
}

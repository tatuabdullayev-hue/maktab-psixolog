import { useEffect, useRef, useState } from 'react';
import '../nm2.css';
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

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  student_talk: { bg: '#ede9fe', text: '#6d4ce0', dot: '#6d4ce0' },
  parent_talk:  { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
  teacher_talk: { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
  other:        { bg: '#e0f2fe', text: '#0369a1', dot: '#06b6d4' },
};

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface Props {
  studentId: string;
  studentName: string;
  studentClass?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteModal({ studentId, studentName, studentClass, onClose, onSaved }: Props) {
  const [notes, setNotes]     = useState<Note[]>([]);
  const [type, setType]       = useState('student_talk');
  const [noteText, setNoteText] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [saving, setSaving]   = useState(false);
  const [delId, setDelId]     = useState<string | null>(null);
  const [sent, setSent]       = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSendToInspector = async () => {
    setSent(true);
    await api.post('/notes', {
      studentId,
      type: 'other',
      note: "Inspektor-psixologga yuborildi — holat nazorat ostiga olindi.",
      nextStep: 'Inspektor xulosasini kutish',
    });
    load();
    onSaved();
  };

  const load = () =>
    api.get('/notes', { params: { studentId } }).then(({ data }) => setNotes(data));

  useEffect(() => { load(); }, [studentId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    await api.post('/notes', {
      studentId, type,
      note: noteText.trim(),
      nextStep: nextStep.trim() || undefined,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleDel = async (id: string) => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    setDelId(id);
    await api.delete(`/notes/${id}`);
    setDelId(null);
    load(); onSaved();
  };

  const tc = TYPE_COLORS[type];

  return (
    <div
      className="nm2-backdrop"
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="nm2-modal">

        {/* ── HEADER ── */}
        <div className="nm2-header">
          <div className="nm2-avatar">{getInitials(studentName)}</div>
          <div className="nm2-hinfo">
            <div className="nm2-hname">{studentName}</div>
            {studentClass && <div className="nm2-hclass">{studentClass}-sinf o'quvchisi</div>}
          </div>
          <div className="nm2-htag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            Ish jurnali
          </div>
          {sent ? (
            <div className="nm2-sent-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Yuborildi
            </div>
          ) : (
            <button className="nm2-send-btn" type="button" onClick={handleSendToInspector} title="Inspektora yuborish">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Inspektora yuborish
            </button>
          )}
          <button className="nm2-xbtn" onClick={onClose} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── BODY: form + illustration ── */}
        <div className="nm2-body">
          <form className="nm2-form" onSubmit={handleSave}>

            {/* active type indicator */}
            <div className="nm2-type-active" style={{ color: tc.text, background: tc.bg }}>
              <span className="nm2-type-active-icon">{TYPE_ICONS[type]}</span>
              {TYPE_LABELS[type]}
            </div>

            {/* dropdown */}
            <div className="nm2-field">
              <div className="nm2-select-box">
                <select
                  className="nm2-select"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <svg className="nm2-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            {/* textarea */}
            <div className="nm2-field nm2-field--grow">
              <div className="nm2-textarea-box">
                <textarea
                  className="nm2-textarea"
                  placeholder="Qilgan ish, kuzatuvlar..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={4}
                  required
                />
                <svg className="nm2-edit-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
            </div>

            {/* next step */}
            <div className="nm2-field">
              <div className="nm2-input-box">
                <svg className="nm2-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <input
                  className="nm2-input"
                  placeholder="Keyingi qadam (ixtiyoriy)"
                  value={nextStep}
                  onChange={e => setNextStep(e.target.value)}
                />
              </div>
            </div>

            {/* save btn */}
            <button type="submit" className="nm2-savebtn" disabled={saving || !noteText.trim()}>
              {saving ? (
                'Saqlanmoqda...'
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Saqlash
                </>
              )}
            </button>
          </form>

          {/* illustration */}
          <div className="nm2-illus" aria-hidden="true">
            <svg width="110" height="140" viewBox="0 0 110 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* clipboard base */}
              <rect x="12" y="20" width="82" height="106" rx="10" fill="#ede9fe"/>
              <rect x="12" y="20" width="82" height="106" rx="10" stroke="#c4b5fd" strokeWidth="1.5"/>
              {/* clip top */}
              <rect x="34" y="12" width="38" height="18" rx="9" fill="#c4b5fd"/>
              <rect x="40" y="14" width="26" height="14" rx="7" fill="#ede9fe"/>
              {/* lines */}
              <rect x="24" y="46" width="58" height="6" rx="3" fill="#c4b5fd" opacity=".6"/>
              <rect x="24" y="58" width="44" height="5" rx="2.5" fill="#ddd6fe" opacity=".7"/>
              {/* check circles */}
              <circle cx="34" cy="82" r="11" fill="#6d4ce0"/>
              <path d="M28 82l5 5 9-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="34" cy="104" r="11" fill="#a78bfa"/>
              <path d="M28 104l5 5 9-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              {/* deco circles */}
              <circle cx="98" cy="18" r="16" fill="#6d4ce0" opacity=".12"/>
              <circle cx="98" cy="18" r="9"  fill="#6d4ce0" opacity=".18"/>
              <circle cx="8"  cy="110" r="9"  fill="#a78bfa" opacity=".2"/>
              <circle cx="8"  cy="110" r="5"  fill="#a78bfa" opacity=".25"/>
              {/* sparkles */}
              <circle cx="95" cy="60" r="3" fill="#c4b5fd" opacity=".7"/>
              <circle cx="18" cy="38" r="2" fill="#a78bfa" opacity=".5"/>
            </svg>
          </div>
        </div>

        {/* ── HISTORY ── */}
        <div className="nm2-history">
          <div className="nm2-hist-header">
            <div className="nm2-hist-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ISH TARIXI
            </div>
            <div className="nm2-hist-count">{notes.length} ta yozuv</div>
          </div>

          {notes.length === 0 ? (
            <div className="nm2-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <p>Hali hech qanday ish kiritilmagan</p>
            </div>
          ) : (
            <div className="nm2-timeline">
              {notes.map((n, i) => {
                const c = TYPE_COLORS[n.type] ?? TYPE_COLORS.other;
                return (
                  <div className="nm2-titem" key={n.id}>
                    <div className="nm2-ttrack">
                      <div
                        className="nm2-tdot"
                        style={i === 0
                          ? { background: c.dot, borderColor: c.dot }
                          : { background: 'transparent', borderColor: c.dot }
                        }
                      />
                      {i < notes.length - 1 && <div className="nm2-tline"/>}
                    </div>
                    <div className="nm2-tcontent">
                      <div className="nm2-ttop">
                        <span className="nm2-tchip" style={{ background: c.bg, color: c.text }}>
                          {TYPE_ICONS[n.type]} {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                        <span className="nm2-tdate">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {fmtDate(n.createdAt)}
                        </span>
                        <button
                          type="button"
                          className="nm2-tmenu"
                          disabled={delId === n.id}
                          onClick={() => handleDel(n.id)}
                          title="O'chirish"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                      <p className="nm2-tnote">{n.note}</p>
                      {n.nextStep && <p className="nm2-tnext">— {n.nextStep}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="nm2-footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Barcha suhbatlar va kuzatuvlar maxfiy saqlanadi.
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft:'auto'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>

      </div>
    </div>
  );
}

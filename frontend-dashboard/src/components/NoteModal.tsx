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

const TYPE_LABELS: Record<string, string> = {
  student_talk: "O'quvchi bilan suhbat",
  parent_talk: 'Ota-ona bilan suhbat',
  teacher_talk: 'Sinf rahbari bilan suhbat',
  other: 'Boshqa',
};

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteModal({ studentId, studentName, onClose, onSaved }: Props) {
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
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal">
        <div className="modal__header">
          <h3>📝 {studentName} — ish jurnali</h3>
          <button type="button" className="modal__close" onClick={onClose}>✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <select
            className="topbar__input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <textarea
            className="modal__textarea"
            placeholder="Qilgan ish, kuzatuvlar..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            required
          />

          <input
            className="topbar__input"
            placeholder="Keyingi qadam (ixtiyoriy)"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
          />

          <button type="submit" className="btn btn-export" disabled={saving || !note.trim()}>
            {saving ? 'Saqlanmoqda...' : '✓ Saqlash'}
          </button>
        </form>

        <div className="modal__history">
          <h4>Ish tarixi</h4>
          {notes.length === 0 ? (
            <p className="muted">Hali hech qanday ish kiritilmagan</p>
          ) : (
            notes.map((n) => (
              <div className="note-item" key={n.id}>
                <div className="note-item__top">
                  <span className="note-item__type">{TYPE_LABELS[n.type] ?? n.type}</span>
                  <span className="note-item__date">
                    {new Date(n.createdAt).toLocaleDateString('uz-UZ')}
                  </span>
                  <button
                    type="button"
                    className="note-item__del"
                    disabled={deleting === n.id}
                    onClick={() => handleDelete(n.id)}
                  >
                    🗑
                  </button>
                </div>
                <p className="note-item__text">{n.note}</p>
                {n.nextStep && (
                  <p className="note-item__next">→ {n.nextStep}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { TYPE_LABELS };

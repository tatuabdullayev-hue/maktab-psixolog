import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import './add-to-monitor-modal.css';

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export function AddToMonitorModal({ onClose, onAdded }: Props) {
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [grade, setGrade] = useState('');
  const [fullName, setFullName] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/students').then(({ data }) => setAllStudents(data));
  }, []);

  const classes = useMemo(() => {
    const set = new Set((allStudents as any[]).map(s => s.className).filter(Boolean));
    return [...set].sort((a, b) => {
      const na = parseInt(a); const nb = parseInt(b);
      if (na !== nb) return na - nb;
      return a.localeCompare(b);
    });
  }, [allStudents]);

  const canSubmit = grade && fullName.trim().length >= 3 && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ') || '-';

      await api.post('/dashboard/add-to-monitor', {
        firstName,
        lastName,
        className: grade,
        reason: reason.trim() || undefined,
      });
      onAdded();
      onClose();
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
      setSaving(false);
    }
  }

  return (
    <div className="atm-backdrop" onClick={e => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="atm-modal">

        <div className="atm-header">
          <div className="atm-header__icon">➕</div>
          <div>
            <div className="atm-header__title">Ichki nazoratga qo'shish</div>
            <div className="atm-header__sub">Ma'lumotlarni kiriting</div>
          </div>
          <button className="atm-close" type="button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="atm-form">

          {/* Sinf */}
          <div className="atm-field">
            <label className="atm-label">Sinf <span className="atm-req">*</span></label>
            <select
              className="atm-select"
              value={grade}
              onChange={e => setGrade(e.target.value)}
            >
              <option value="">Sinfni tanlang</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Ism familiya */}
          <div className="atm-field">
            <label className="atm-label">Ism va familiya <span className="atm-req">*</span></label>
            <input
              className="atm-input"
              placeholder="Masalan: Akbar Toshmatov"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

          {/* Sabab */}
          <div className="atm-field">
            <label className="atm-label">Sabab</label>
            <textarea
              className="atm-textarea"
              placeholder="Nima uchun nazoratga olinayotganini yozing..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="atm-error">{error}</div>}

          <div className="atm-actions">
            <button type="button" className="atm-btn atm-btn--cancel" onClick={onClose}>
              Bekor qilish
            </button>
            <button type="submit" className="atm-btn atm-btn--submit" disabled={!canSubmit}>
              {saving ? "Qo'shilmoqda..." : "➕ Nazoratga qo'shish"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

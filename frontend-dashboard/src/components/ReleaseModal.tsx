import { useState } from 'react';
import { api } from '../api/client';
import './release-modal.css';

interface Props {
  studentId: string;
  studentName: string;
  className: string;
  dangerCount: number;
  noteCount: number;
  onClose: () => void;
  onReleased: () => void;
}

export function ReleaseModal({ studentId, studentName, className, dangerCount, noteCount, onClose, onReleased }: Props) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const MIN_CHARS = 100;
  const remaining = MIN_CHARS - reason.trim().length;
  const canSubmit = reason.trim().length >= MIN_CHARS && confirmed && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/notes', {
        studentId,
        type: 'other',
        note: `[NAZORAT_CHIQISH] ${reason.trim()}`,
        nextStep: 'Psixolog tomonidan ichki nazoratdan chiqarildi',
      });
      onReleased();
      onClose();
    } catch {
      setError("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      setSaving(false);
    }
  }

  return (
    <div className="rm-backdrop" onClick={e => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="rm-modal">

        {/* Header */}
        <div className="rm-header">
          <div className="rm-header__icon">⚠️</div>
          <div>
            <div className="rm-header__title">Ichki nazoratdan chiqarish</div>
            <div className="rm-header__sub">{studentName} — {className} sinf</div>
          </div>
          <button className="rm-close" type="button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Warning */}
        <div className="rm-warning">
          <div className="rm-warning__row">
            <span>🔴 Yuqori xavf aniqlangan marta:</span>
            <strong>{dangerCount} marta</strong>
          </div>
          <div className="rm-warning__row">
            <span>📝 Psixolog kiritgan ish yozuvlari:</span>
            <strong>{noteCount} ta</strong>
          </div>
          <div className="rm-warning__text">
            Bu o'quvchi <strong>{dangerCount} marta</strong> yuqori xavf darajasida aniqlangan.
            Nazoratdan chiqarish qaroringiz tizimda saqlanadi va tekshirilishi mumkin.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rm-form">
          {/* Reason */}
          <div className="rm-field">
            <label className="rm-label">
              Nazoratdan chiqarish sababi <span className="rm-required">*</span>
            </label>
            <textarea
              className="rm-textarea"
              placeholder="O'quvchi bilan olib borilgan ishlар, kuzatuvlar va nazoratdan chiqarishga asos bo'lgan holat haqida batafsil yozing..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={5}
              required
            />
            <div className={`rm-counter ${remaining <= 0 ? 'rm-counter--ok' : ''}`}>
              {remaining > 0
                ? `Yana ${remaining} ta belgi kiriting`
                : `✓ Yetarli (${reason.trim().length} belgi)`
              }
            </div>
          </div>

          {/* Confirm */}
          <label className="rm-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            <span>
              Men, maktab psixologi sifatida, ushbu o'quvchini ichki nazoratdan chiqarishga
              to'liq javobgarman va bu qaror asosli ekanligini tasdiqlayman.
            </span>
          </label>

          {error && <div className="rm-error">{error}</div>}

          {/* Buttons */}
          <div className="rm-actions">
            <button type="button" className="rm-btn rm-btn--cancel" onClick={onClose}>
              Bekor qilish
            </button>
            <button type="submit" className="rm-btn rm-btn--submit" disabled={!canSubmit}>
              {saving ? 'Saqlanmoqda...' : '✓ Nazoratdan chiqarish'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

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
        note: `[RELEASE] ${reason.trim()}`,
        nextStep: 'Released from monitoring by psychologist',
      });
      onReleased();
      onClose();
    } catch {
      setError("An error occurred. Please try again.");
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
            <div className="rm-header__title">Release from Monitoring</div>
            <div className="rm-header__sub">{studentName} — Grade {className}</div>
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
            <span>🔴 Times detected at High Risk:</span>
            <strong>{dangerCount} time(s)</strong>
          </div>
          <div className="rm-warning__row">
            <span>📝 Psychologist action logs:</span>
            <strong>{noteCount} record(s)</strong>
          </div>
          <div className="rm-warning__text">
            This student was detected at High Risk <strong>{dangerCount} time(s)</strong>.
            Your decision to release them from monitoring will be saved and can be reviewed.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rm-form">
          {/* Reason */}
          <div className="rm-field">
            <label className="rm-label">
              Reason for release <span className="rm-required">*</span>
            </label>
            <textarea
              className="rm-textarea"
              placeholder="Describe in detail the work done with the student, observations, and the basis for releasing them from monitoring..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={5}
              required
            />
            <div className={`rm-counter ${remaining <= 0 ? 'rm-counter--ok' : ''}`}>
              {remaining > 0
                ? `Enter ${remaining} more character(s)`
                : `✓ Sufficient (${reason.trim().length} characters)`
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
              As the school psychologist, I take full responsibility for releasing this student
              from monitoring and confirm that this decision is well-founded.
            </span>
          </label>

          {error && <div className="rm-error">{error}</div>}

          {/* Buttons */}
          <div className="rm-actions">
            <button type="button" className="rm-btn rm-btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rm-btn rm-btn--submit" disabled={!canSubmit}>
              {saving ? 'Saving...' : '✓ Release from Monitoring'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import './add-to-monitor-modal.css';

interface Student {
  id: string;
  fullName: string;
  className: string;
}

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export function AddToMonitorModal({ onClose, onAdded }: Props) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/students').then(({ data }) => {
      const list = (data as any[]).map(s => ({
        id: s.id,
        fullName: s.fullName,
        className: s.className,
      }));
      setAllStudents(list);
    });
  }, []);

  const filtered = search.length >= 2
    ? allStudents.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/notes', {
        studentId: selected.id,
        type: 'other',
        note: `[NAZORAT_QOSHISH] ${reason.trim() || "Psixolog tomonidan ichki nazoratga qo'shildi"}`,
        nextStep: 'Muntazam kuzatuv va psixologik yordam ko\'rsatish',
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
            <div className="atm-header__sub">O'quvchini qo'lda nazorat ro'yxatiga kiriting</div>
          </div>
          <button className="atm-close" type="button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="atm-form">

          {/* Student search */}
          <div className="atm-field">
            <label className="atm-label">O'quvchi <span className="atm-req">*</span></label>
            {selected ? (
              <div className="atm-selected">
                <div className="atm-selected__info">
                  <div className="atm-selected__name">{selected.fullName}</div>
                  <div className="atm-selected__class">{selected.className} sinf</div>
                </div>
                <button type="button" className="atm-selected__clear" onClick={() => { setSelected(null); setSearch(''); }}>
                  ✕ O'zgartirish
                </button>
              </div>
            ) : (
              <div className="atm-search-wrap">
                <svg className="atm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="atm-search-input"
                  placeholder="Ism yoki familiya bo'yicha qidiring..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
                {filtered.length > 0 && (
                  <div className="atm-dropdown">
                    {filtered.map(s => (
                      <div
                        key={s.id}
                        className="atm-dropdown__item"
                        onClick={() => { setSelected(s); setSearch(''); }}
                      >
                        <div className="atm-dropdown__name">{s.fullName}</div>
                        <div className="atm-dropdown__class">{s.className} sinf</div>
                      </div>
                    ))}
                  </div>
                )}
                {search.length >= 2 && filtered.length === 0 && (
                  <div className="atm-dropdown atm-dropdown--empty">O'quvchi topilmadi</div>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="atm-field">
            <label className="atm-label">Qo'shish sababi</label>
            <textarea
              className="atm-textarea"
              placeholder="Ixtiyoriy: nima uchun bu o'quvchini nazoratga olish kerakligi haqida yozing..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
            />
          </div>

          {error && <div className="atm-error">{error}</div>}

          <div className="atm-actions">
            <button type="button" className="atm-btn atm-btn--cancel" onClick={onClose}>
              Bekor qilish
            </button>
            <button type="submit" className="atm-btn atm-btn--submit" disabled={!selected || saving}>
              {saving ? 'Qo\'shilmoqda...' : "➕ Nazoratga qo'shish"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

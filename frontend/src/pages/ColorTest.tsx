import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ColorOption {
  key: string;
  label: string;
  hex: string;
}

const COLORS: ColorOption[] = [
  { key: 'blue', label: "Ko'k", hex: '#2E5C8A' },
  { key: 'green', label: 'Yashil', hex: '#3F8F5C' },
  { key: 'red', label: 'Qizil', hex: '#C0392B' },
  { key: 'yellow', label: 'Sariq', hex: '#F1C40F' },
  { key: 'violet', label: 'Binafsha', hex: '#8E44AD' },
  { key: 'brown', label: 'Jigarrang', hex: '#7B4B2A' },
  { key: 'black', label: 'Qora', hex: '#2B2B2B' },
  { key: 'grey', label: 'Kulrang', hex: '#95A5A6' },
];

export function ColorTest() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [order, setOrder] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const remaining = COLORS.filter((c) => !order.includes(c.key));
  const isDone = order.length === COLORS.length;

  const handlePick = (key: string) => {
    setOrder((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleUndo = () => {
    setOrder((prev) => prev.slice(0, -1));
  };

  const handleFinish = async () => {
    if (submitting || !isDone) return;
    setSubmitting(true);
    try {
      await api.post('/color-test/submit', { order });
    } finally {
      navigate('/thanks');
    }
  };

  return (
    <div className="page game-page">
      <div className="game-topbar">
        <div className="game-brand">
          <span className="game-brand__icon">🧠✨</span>
          <div>
            <div className="game-brand__title">AI PSIXOLOG</div>
            <div className="game-brand__subtitle">Rang olami</div>
          </div>
        </div>
        <div className="game-actions">
          <button
            className="btn-exit"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Chiqish
          </button>
        </div>
      </div>

      <div className="welcome-card">
        <div>
          <div className="welcome-card__title">Rang olami 🎨</div>
          <div className="welcome-card__subtitle">
            Ranglarni eng yoqimlisidan eng yoqimsiziga qarab birma-bir tanlang.
          </div>
        </div>
        <div className="welcome-card__hero">🎨</div>
      </div>

      <div className="color-test-card">
        <div className="color-grid">
          {remaining.map((color) => (
            <button
              key={color.key}
              className="color-swatch"
              style={{ background: color.hex }}
              onClick={() => handlePick(color.key)}
            >
              <span className="color-swatch__label">{color.label}</span>
            </button>
          ))}
        </div>

        <div className="color-ranked">
          <div className="color-ranked__title">Sizning tanlovingiz:</div>
          <div className="color-ranked__list">
            {order.map((key, idx) => {
              const color = COLORS.find((c) => c.key === key)!;
              return (
                <div className="color-ranked__item" key={key}>
                  <span className="color-ranked__index">{idx + 1}</span>
                  <span
                    className="color-ranked__swatch"
                    style={{ background: color.hex }}
                  />
                  <span>{color.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="game-footer">
        <div className="game-hint">
          💡 To'g'ri yoki noto'g'ri javob yo'q, faqat o'zingizga yoqqanini tanlang.
        </div>
        {order.length > 0 && !isDone && (
          <button className="btn btn-secondary" onClick={handleUndo}>
            ← Ortga
          </button>
        )}
        <button
          className="btn btn-primary game-next-btn"
          disabled={!isDone || submitting}
          onClick={handleFinish}
        >
          Yakunlash →
        </button>
      </div>
    </div>
  );
}

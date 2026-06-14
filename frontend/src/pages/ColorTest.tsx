import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ColorOption {
  key: string;
  label: string;
  icon: string;
  gradient: string;
}

const COLORS: ColorOption[] = [
  { key: 'blue', label: "Ko'k", icon: '🙂', gradient: 'linear-gradient(160deg, #4A7FC9, #2E5C8A)' },
  { key: 'green', label: 'Yashil', icon: '💬', gradient: 'linear-gradient(160deg, #5FB37D, #3F8F5C)' },
  { key: 'red', label: 'Qizil', icon: '❤️', gradient: 'linear-gradient(160deg, #E0594A, #C0392B)' },
  { key: 'yellow', label: 'Sariq', icon: '☀️', gradient: 'linear-gradient(160deg, #FBD96B, #F1C40F)' },
  { key: 'violet', label: 'Binafsha', icon: '💎', gradient: 'linear-gradient(160deg, #A569BD, #8E44AD)' },
  { key: 'brown', label: 'Jigarrang', icon: '☕', gradient: 'linear-gradient(160deg, #9A6A45, #7B4B2A)' },
  { key: 'black', label: 'Qora', icon: '🌙', gradient: 'linear-gradient(160deg, #4A4A4A, #2B2B2B)' },
  { key: 'grey', label: 'Kulrang', icon: '☁️', gradient: 'linear-gradient(160deg, #BFC9CF, #95A5A6)' },
];

export function ColorTest() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [order, setOrder] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

      <div className="welcome-card color-hero">
        <div className="color-hero__icon">🎨</div>
        <div>
          <div className="welcome-card__title">Rang olami 🎨</div>
          <div className="welcome-card__subtitle">
            Ranglarni eng yoqimlisidan eng yoqimsiziga qarab birma-bir tanlang.
          </div>
        </div>
        <span className="color-hero__sparkle color-hero__sparkle--1">✦</span>
        <span className="color-hero__sparkle color-hero__sparkle--2">✦</span>
        <span className="color-hero__sparkle color-hero__sparkle--3">✦</span>
      </div>

      <div className="color-test-card">
        <div className="color-grid">
          {COLORS.map((color) => {
            const pickedIndex = order.indexOf(color.key);
            const isPicked = pickedIndex !== -1;
            return (
              <button
                key={color.key}
                className={`color-card${isPicked ? ' color-card--picked' : ''}`}
                onClick={() => handlePick(color.key)}
                disabled={isPicked}
              >
                <div className="color-card__top" style={{ background: color.gradient }}>
                  <span className="color-card__icon">{color.icon}</span>
                </div>
                <div className="color-card__bottom">
                  <span className="color-card__badge">
                    {isPicked ? pickedIndex + 1 : ''}
                  </span>
                  <span className="color-card__label">{color.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="color-info">
          <span className="color-info__icon">💡</span>
          <div>
            <div className="color-info__title">Sizning tanlovingiz:</div>
            <div className="color-info__text">
              {isDone
                ? "Barcha ranglar tanlandi. Endi 'Yakunlash' tugmasini bosing."
                : `Ranglarni tanlash orqali biz sizning kayfiyatingizni yaxshiroq tushunishimiz mumkin. (${order.length}/${COLORS.length})`}
            </div>
          </div>
          <span className="color-info__sparkle">✦</span>
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

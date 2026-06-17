import { useEffect, useState } from 'react';

const FALLBACK_MOTIVATIONS = [
  { emoji: '💪', text: "Seningdagi kuch har qanday to'siqni yengib o'tishga yetadi!" },
  { emoji: '🌟', text: "Sen o'zingcha noyob insonsan — boshqa hech kim sen kabi emas!" },
  { emoji: '🚀', text: "Har bir qiyin kun seni yanada kuchliroq qiladi. Davom et!" },
];

export function Thanks() {
  const [aiText, setAiText] = useState<string | null>(null);
  const [fallbackIdx, setFallbackIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('ai_recommendation');
    if (saved) {
      setAiText(saved);
      sessionStorage.removeItem('ai_recommendation');
    }
  }, []);

  // Faqat AI tavsiya yo'q bo'lsa fallback aylanadi
  useEffect(() => {
    if (aiText) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFallbackIdx(i => (i + 1) % FALLBACK_MOTIVATIONS.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [aiText]);

  const fallback = FALLBACK_MOTIVATIONS[fallbackIdx];

  return (
    <div className="page page--center thanks-page">
      <div className="card center thanks-card">
        <div className="thanks-confetti">🎉</div>
        <h2 className="thanks-title">Rahmat!</h2>
        <p className="thanks-sub">
          Sarguzashtni muvaffaqiyatli yakunladingiz. Javoblaringiz qabul qilindi.
        </p>

        {aiText ? (
          <div className="thanks-motivation thanks-motivation--visible thanks-motivation--ai">
            <span className="thanks-motivation__badge">🤖 AI tavsiya</span>
            <p className="thanks-motivation__text">{aiText}</p>
          </div>
        ) : (
          <>
            <div className={`thanks-motivation${visible ? ' thanks-motivation--visible' : ''}`}>
              <span className="thanks-motivation__emoji">{fallback.emoji}</span>
              <p className="thanks-motivation__text">{fallback.text}</p>
            </div>
            <div className="thanks-dots">
              {FALLBACK_MOTIVATIONS.map((_, i) => (
                <span key={i} className={`thanks-dot${i === fallbackIdx ? ' thanks-dot--active' : ''}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

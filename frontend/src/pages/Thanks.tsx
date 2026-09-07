import { useEffect, useState } from 'react';

interface StudentType {
  emoji: string;
  title: string;
  desc: string;
}

const FALLBACK_TYPES: StudentType[] = [
  { emoji: '🤝', title: 'Social', desc: "You connect well with others — people like you find their place everywhere!" },
  { emoji: '🧠', title: 'Analytical', desc: "You read situations accurately — that's a huge advantage!" },
  { emoji: '☀️', title: 'Positive', desc: 'Your energy lifts everyone around you. Keep it up!' },
  { emoji: '🦁', title: 'Strong Spirit', desc: "You have determination that others lack — channel it right and everyone will notice!" },
  { emoji: '🎨', title: 'Creative Soul', desc: "You feel things others don't see — that's a rare gift!" },
];

export function Thanks() {
  const [type, setType] = useState<StudentType | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('student_type');
    if (saved) {
      try {
        setType(JSON.parse(saved));
        sessionStorage.removeItem('student_type');
      } catch {
        setType(FALLBACK_TYPES[Math.floor(Math.random() * FALLBACK_TYPES.length)]);
      }
    } else {
      setType(FALLBACK_TYPES[Math.floor(Math.random() * FALLBACK_TYPES.length)]);
    }
  }, []);

  // Suspense: 1.5s kutib, keyin reveal
  useEffect(() => {
    if (!type) return;
    const t1 = setTimeout(() => setCounted(true), 400);
    const t2 = setTimeout(() => setRevealed(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [type]);

  return (
    <div className="page page--center thanks-page">
      <div className="thanks-card">
        <div className="thanks-confetti">🎉</div>
        <h2 className="thanks-title">Well Done!</h2>
        <p className="thanks-sub">The adventure is over. Now for the most exciting part...</p>

        <div className="thanks-reveal-label">
          {counted ? '✨ Your type:' : 'Analyzing your results...'}
        </div>

        <div className={`thanks-reveal${revealed ? ' thanks-reveal--open' : ''}`}>
          {revealed && type ? (
            <>
              <div className="thanks-reveal__emoji">{type.emoji}</div>
              <div className="thanks-reveal__title">{type.title}</div>
              <p className="thanks-reveal__desc">{type.desc}</p>
            </>
          ) : (
            <div className="thanks-reveal__dots">
              <span /><span /><span />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

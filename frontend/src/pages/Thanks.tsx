import { useEffect, useState } from 'react';

interface StudentType {
  emoji: string;
  title: string;
  desc: string;
}

const FALLBACK_TYPES: StudentType[] = [
  { emoji: '🤝', title: "Do'stsevar", desc: "Atrofingilar bilan munosabating zo'r — bunday odamlar har joyda o'zini topadi!" },
  { emoji: '🧠', title: 'Aqlli', desc: "Vaziyatlarni to'g'ri o'qiy olasiz — bu katta ustunlik!" },
  { emoji: '☀️', title: 'Ijobiy', desc: 'Sendagi energiya atrofingilarni ham quvontiradi. Shunday davom et!' },
  { emoji: '🦁', title: 'Kuchli ruh', desc: "Senda boshqalar yo'qolsin degan iroda bor — uni to'g'ri yo'naltirsang, hamma seni kuzatadi!" },
  { emoji: '🎨', title: 'Sezgir ijodkor', desc: "Sen narsalarni boshqalar ko'rmaydigan tarzda his qilasiz — bu kamdan-kam uchraydigan sovg'a!" },
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
        <h2 className="thanks-title">Barakalla!</h2>
        <p className="thanks-sub">Sarguzasht yakunlandi. Endi eng qiziq qism...</p>

        <div className="thanks-reveal-label">
          {counted ? '✨ Sening turning:' : 'Natijang tahlil qilindi...'}
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

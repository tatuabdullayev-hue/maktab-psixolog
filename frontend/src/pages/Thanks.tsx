import { useEffect, useState } from 'react';

const MOTIVATIONS = [
  { emoji: '💪', text: "Seningdagi kuch har qanday to'siqni yengib o'tishga yetadi!" },
  { emoji: '🌟', text: "Sen o'zingcha noyob insonsan — boshqa hech kim sen kabi emas!" },
  { emoji: '🤝', text: "Do'stlaring seni sevadi, ularga mehr ko'rsat — va ko'p do'stga ega bo'lasan!" },
  { emoji: '🧠', text: "Aqling va zehnin — bu eng katta boyliging, uni rivojlantir!" },
  { emoji: '🚀', text: "Har bir qiyin kun seni yanada kuchliroq qiladi. Davom et!" },
  { emoji: '😊', text: "Tabassuming atrofingilarni quvontiradi — ko'proq kulgin!" },
  { emoji: '📚', text: "Bilim — bu qurol. Qanchalik ko'p o'qisang, shunchalik kuchli bo'lasan!" },
  { emoji: '🌈', text: "Qiyinchiliklar vaqtinchalik, muvaffaqiyating esa abadiy!" },
  { emoji: '🏆', text: "Sen allaqachon g'olibsan — bu testni mard o'tdingmi? Isboti shu!" },
  { emoji: '❤️', text: "Atrofingilarni seving — muhabbat berib, ko'proq muhabbat olasiz!" },
];

export function Thanks() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % MOTIVATIONS.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const mot = MOTIVATIONS[idx];

  return (
    <div className="page page--center thanks-page">
      <div className="card center thanks-card">
        <div className="thanks-confetti">🎉</div>
        <h2 className="thanks-title">Rahmat!</h2>
        <p className="thanks-sub">
          Sarguzashtni muvaffaqiyatli yakunladingiz. Javoblaringiz qabul qilindi.
        </p>

        <div className={`thanks-motivation${visible ? ' thanks-motivation--visible' : ''}`}>
          <span className="thanks-motivation__emoji">{mot.emoji}</span>
          <p className="thanks-motivation__text">{mot.text}</p>
        </div>

        <div className="thanks-dots">
          {MOTIVATIONS.map((_, i) => (
            <span key={i} className={`thanks-dot${i === idx ? ' thanks-dot--active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

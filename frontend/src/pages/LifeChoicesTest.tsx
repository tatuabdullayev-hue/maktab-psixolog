import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

import q1a from '../assets/life-choices/q1a.jpg';
import q1b from '../assets/life-choices/q1b.jpg';
import q2a from '../assets/life-choices/q2a.jpg';
import q2b from '../assets/life-choices/q2b.jpg';
import q3a from '../assets/life-choices/q3a.jpg';
import q3b from '../assets/life-choices/q3b.jpg';
import q4a from '../assets/life-choices/q4a.jpg';
import q4b from '../assets/life-choices/q4b.jpg';
import q5a from '../assets/life-choices/q5a.jpg';
import q5b from '../assets/life-choices/q5b.jpg';
import q6a from '../assets/life-choices/q6a.jpg';
import q6b from '../assets/life-choices/q6b.jpg';
import q7a from '../assets/life-choices/q7a.jpg';
import q7b from '../assets/life-choices/q7b.jpg';
import q8a from '../assets/life-choices/q8a.jpg';
import q8b from '../assets/life-choices/q8b.jpg';

interface LifeChoiceQuestion {
  text: string;
  options: { key: 'a' | 'b'; label: string; image: string }[];
}

const QUESTIONS: LifeChoiceQuestion[] = [
  {
    text: "G'azabingiz kelganda odatda nima qilishni xohlaysiz?",
    options: [
      { key: 'a', label: 'Buyumni sindirish, zarar yetkazish', image: q1a },
      { key: 'b', label: "Tincha olishga harakat qilish, o'ylab ko'rish", image: q1b },
    ],
  },
  {
    text: "Do'stlaringiz sizni biror xavfli ishga undasa, siz nima qilasiz?",
    options: [
      { key: 'a', label: 'Ular bilan birga qilaman', image: q2a },
      { key: 'b', label: "Rad etaman, o'z yo'lim bilan boraman", image: q2b },
    ],
  },
  {
    text: 'Qaysi yo\'lni tanlashga moyilsiz?',
    options: [
      { key: 'a', label: 'Qisqa, lekin xavfli yo\'l', image: q3a },
      { key: 'b', label: 'Uzoq, lekin xavfsiz yo\'l', image: q3b },
    ],
  },
  {
    text: 'Qachondir qoidalarni buzganingizda, sizningcha nima bo\'ladi?',
    options: [
      { key: 'a', label: "Hech qanday muammo bo'lmaydi, hamma shunday qiladi", image: q4a },
      { key: 'b', label: "Bu noto'g'ri, muammoga olib keladi", image: q4b },
    ],
  },
  {
    text: 'Muammo yoki kelishmovchilik bo\'lsa, siz nima qilasiz?',
    options: [
      { key: 'a', label: 'Jang qilish, kuch ishlatish', image: q5a },
      { key: 'b', label: 'Gaplashib, yechim topishga harakat qilish', image: q5b },
    ],
  },
  {
    text: "Bo'sh vaqtingizda qaysi faoliyat sizga ko'proq yoqadi?",
    options: [
      { key: 'a', label: 'Kompyuter o\'yinlari, telefonda vaqt o\'tkazish', image: q6a },
      { key: 'b', label: 'Kitob o\'qish, o\'rganish, yangi narsalar bilish', image: q6b },
    ],
  },
  {
    text: 'Yaqin kelajakda eng ko\'p nimani xohlaysiz?',
    options: [
      { key: 'a', label: "Pul, mashhur bo'lish, boylik", image: q7a },
      { key: 'b', label: 'Yaxshi kasb, bilim, barqaror hayot', image: q7b },
    ],
  },
  {
    text: 'Agar kimdir sizga yomon munosabatda bo\'lsa, siz nima qilasiz?',
    options: [
      { key: 'a', label: 'Qasos olaman, javob qaytaraman', image: q8a },
      { key: 'b', label: 'Uzoqlashaman, vaziyatdan chiqib ketaman', image: q8b },
    ],
  },
];

export function LifeChoicesTest() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<('a' | 'b')[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const question = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const selected = answers[step];

  const handleSelect = (key: 'a' | 'b') => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = key;
      return next;
    });
  };

  const handleFinish = async (finalAnswers: ('a' | 'b')[]) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/life-choices/submit', { answers: finalAnswers });
    } finally {
      navigate('/thanks');
    }
  };

  const handleNext = () => {
    if (!selected) return;
    if (isLast) {
      handleFinish(answers);
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="page game-page">
      <div className="game-topbar">
        <div className="game-brand">
          <span className="game-brand__icon">🧠✨</span>
          <div>
            <div className="game-brand__title">AI PSIXOLOG</div>
            <div className="game-brand__subtitle">Hayot tanlovlari</div>
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
          <div className="welcome-card__title">Hayot tanlovlari 🧭</div>
          <div className="welcome-card__subtitle">
            Har bir vaziyatda sizga yaqinroq variantni tanlang.
          </div>
        </div>
        <div className="welcome-card__hero">🧒💻</div>
      </div>

      <div className="progress-section">
        <div className="progress-section__label">
          <span>Umumiy progress</span>
          <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="life-choice-card">
        <div className="game-badge">
          {step + 1}/{QUESTIONS.length} &mdash; Vaziyatli topshiriq
        </div>
        <div className="game-question">{question.text}</div>

        <div className="life-choice-options">
          {question.options.map((opt) => (
            <button
              key={opt.key}
              className={
                'life-choice-option' + (selected === opt.key ? ' life-choice-option--active' : '')
              }
              onClick={() => handleSelect(opt.key)}
            >
              <div className="life-choice-option__image">
                <img src={opt.image} alt="" />
              </div>
              <div className="life-choice-option__label">{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="game-footer">
        <div className="game-hint">
          💡 To'g'ri yoki noto'g'ri javob yo'q. Muhim narsa - sizning fikringiz!
        </div>
        <button
          className="btn btn-primary game-next-btn"
          disabled={!selected || submitting}
          onClick={handleNext}
        >
          {isLast ? 'Yakunlash →' : 'Keyingisi →'}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import q1Image from '../assets/questions/q1.png';
import q2Image from '../assets/questions/q2.png';
import q3Image from '../assets/questions/q3.png';
import q4Image from '../assets/questions/q4.png';
import q5Image from '../assets/questions/q5.png';

interface TestQuestionOption {
  key: string;
  text: string;
}

interface TestQuestion {
  id: string;
  text: string;
  imageUrl?: string;
  options: TestQuestionOption[];
}

interface TestData {
  id: string;
  title: string;
  description?: string;
  questions: TestQuestion[];
}

const SELECTED_QUESTION_IDS = ['q1', 'q2', 'q4', 'q6', 'q8'];

const OPTION_ICONS = ['🙂', '🤔', '😠', '🤝'];
const TOTAL_SECONDS = 15 * 60;

const MOOD_OPTIONS: { value: string; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😄', label: "A'lo" },
  { value: 'normal', emoji: '🙂', label: 'Yaxshi' },
  { value: 'bad', emoji: '😔', label: 'Yomon' },
  { value: 'very_bad', emoji: '😢', label: 'Juda yomon' },
];

const QUESTION_IMAGES: Record<string, string> = {
  q1: q1Image,
  q2: q2Image,
  q4: q3Image,
  q6: q4Image,
  q8: q5Image,
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameTest() {
  const navigate = useNavigate();
  const { student, logout } = useAuth();
  const [test, setTest] = useState<TestData | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [mood, setMood] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    api.get('/tests').then(({ data }) => {
      if (data.length) setTest(data[0]);
    });
  }, []);

  useEffect(() => {
    Object.values(QUESTION_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (!test || !started) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [test, started]);

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/tests/submit', { testId: test!.id, answers, mood });
    } finally {
      navigate('/thanks');
    }
  };

  useEffect(() => {
    if (secondsLeft === 0 && test && started) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (!test) {
    return <div className="page page--center">Yuklanmoqda...</div>;
  }

  if (!started) {
    return (
      <div className="page game-page">
        <div className="game-topbar">
          <div className="game-brand">
            <span className="game-brand__icon">🧠✨</span>
            <div>
              <div className="game-brand__title">AI PSIXOLOG</div>
              <div className="game-brand__subtitle">Sizni tushunamiz, sizga yordam beramiz</div>
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
            <div className="welcome-card__title">Salom, {student?.firstName ?? "Do'stim"}! 👋</div>
            <div className="welcome-card__subtitle">Boshlashdan oldin, bugungi kayfiyatingiz qanday?</div>
          </div>
          <div className="welcome-card__hero">🧒💻</div>
        </div>

        <div className="mood-select-card">
          <div className="mood-badge">
            <span className="mood-badge__icon">🙂</span>
            <span>Bugungi kayfiyatingizni belgilang</span>
          </div>
          <div className="mood-options">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                className={'mood-option' + (mood === m.value ? ' mood-option--active' : '')}
                onClick={() => setMood(m.value)}
              >
                <span className="mood-option__emoji">{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="game-footer">
          <div className="game-hint">💡 Bu javob ham natijaga ta'sir qiladi, shuning uchun rostini belgilang.</div>
          <button
            className="btn btn-primary game-next-btn"
            disabled={!mood}
            onClick={() => setStarted(true)}
          >
            Davom etish →
          </button>
        </div>
      </div>
    );
  }

  const questions = test.questions.filter((q) => SELECTED_QUESTION_IDS.includes(q.id));
  const question = questions[step];
  const isLast = step === questions.length - 1;
  const illustration = QUESTION_IMAGES[question.id];

  const handleSelect = (key: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: key }));
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
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
            <div className="game-brand__subtitle">Sizni tushunamiz, sizga yordam beramiz</div>
          </div>
        </div>
        <div className="game-actions">
          <div className="time-chip">
            <span>⏱</span>
            <span>Vaqt: {formatTime(secondsLeft)}</span>
          </div>
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
          <div className="welcome-card__title">Salom, {student?.firstName ?? "Do'stim"}! 👋</div>
          <div className="welcome-card__subtitle">
            Bugun siz uchun qiziqarli topshiriq tayyorladik.
          </div>
          <div className="info-chips">
            {student?.className && <span className="info-chip">🎒 Sinf: {student.className}</span>}
            {student?.age && <span className="info-chip">🎂 Yosh: {student.age}</span>}
            {student?.schoolName && <span className="info-chip">🏫 {student.schoolName}</span>}
          </div>
        </div>
        <div className="welcome-card__hero">🧒💻</div>
      </div>

      <div className="progress-section">
        <div className="progress-section__label">
          <span>Umumiy progress</span>
          <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="question-card">
        <div className="question-illustration">
          <img src={illustration} alt="" />
        </div>
        <div className="question-content">
          <div className="game-badge">
            {step + 1}/{questions.length} &mdash; Vaziyatli topshiriq
          </div>
          <div className="game-question">{question.text}</div>

          <div className="options">
            {question.options.map((opt, idx) => (
              <button
                key={opt.key}
                className={
                  'option-btn' +
                  (answers[question.id] === opt.key ? ' option-btn--active' : '')
                }
                onClick={() => handleSelect(opt.key)}
              >
                <span className="option-btn__icon">{OPTION_ICONS[idx % OPTION_ICONS.length]}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="game-footer">
        <div className="game-hint">
          💡 To'g'ri yoki noto'g'ri javob yo'q. Muhim narsa - sizning fikringiz!
        </div>
        <button
          className="btn btn-primary game-next-btn"
          disabled={!answers[question.id] || submitting}
          onClick={handleNext}
        >
          {isLast ? 'Davom etish →' : 'Keyingisi →'}
        </button>
      </div>
    </div>
  );
}

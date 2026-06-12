import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

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

const OPTION_ICONS = ['🙂', '🤔', '😠', '🤝'];
const TOTAL_SECONDS = 15 * 60;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameTest() {
  const navigate = useNavigate();
  const [test, setTest] = useState<TestData | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);

  useEffect(() => {
    api.get('/tests').then(({ data }) => {
      if (data.length) setTest(data[0]);
    });
  }, []);

  useEffect(() => {
    if (!test) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [test]);

  useEffect(() => {
    if (secondsLeft === 0 && test) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (!test) {
    return <div className="page page--center">Yuklanmoqda...</div>;
  }

  const question = test.questions[step];
  const isLast = step === test.questions.length - 1;

  const handleSelect = (key: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: key }));
  };

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/tests/submit', { testId: test.id, answers });
    } finally {
      navigate('/thanks');
    }
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
      <div className="game-header">
        <div className="game-brand">
          <span className="game-brand__icon">🧠✨</span>
          <div>
            <div className="game-brand__title">AI PSIXOLOG</div>
            <div className="game-brand__subtitle">Sizni tushunamiz, sizga yordam beramiz</div>
          </div>
        </div>
        <div className="time-chip">
          <span>⏱</span>
          <span>{formatTime(secondsLeft)}</span>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${((step + 1) / test.questions.length) * 100}%` }}
        />
      </div>
      <div className="game-progress-label">
        {step + 1} / {test.questions.length}
      </div>

      <div className="card game-card">
        <div className="game-badge">Vaziyatli topshiriq</div>
        <div className="card__title game-question">{question.text}</div>

        {question.imageUrl && (
          <img className="game-question__image" src={question.imageUrl} alt="" />
        )}

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

      <div className="game-hint">
        💡 To'g'ri yoki noto'g'ri javob yo'q. Muhim narsa - sizning fikringiz!
      </div>

      <button
        className="btn btn-primary"
        disabled={!answers[question.id] || submitting}
        onClick={handleNext}
      >
        {isLast ? 'Yakunlash' : 'Keyingisi →'}
      </button>
    </div>
  );
}

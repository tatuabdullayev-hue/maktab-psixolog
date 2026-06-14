import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface GameItem {
  emoji: string;
  label: string;
}

const GO_ITEMS: GameItem[] = [
  { emoji: '📚', label: 'Kitob' },
  { emoji: '📓', label: 'Daftar' },
  { emoji: '✏️', label: 'Ruchka' },
  { emoji: '🎒', label: 'Sumka' },
];
const NOGO_ITEM: GameItem = { emoji: '📱', label: 'Telefon' };

const GO_TOTAL = 48;
const NOGO_TOTAL = 12;
const TOTAL_TRIALS = GO_TOTAL + NOGO_TOTAL;
const STIMULUS_MS = 500;
const TRIAL_MS = 2000;

type TrialType = 'go' | 'nogo';

interface Trial extends GameItem {
  type: TrialType;
}

interface TrialResult {
  type: TrialType;
  responded: boolean;
  reactionTimeMs: number | null;
}

function buildSequence(): Trial[] {
  const types: TrialType[] = [
    ...Array(GO_TOTAL).fill('go' as const),
    ...Array(NOGO_TOTAL).fill('nogo' as const),
  ];

  // Aralashtirish, lekin ketma-ket 2 ta "no-go" stimuli chiqmasin
  let shuffled: TrialType[] = types;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    shuffled = [...types];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (!hasLongRun(shuffled, 'nogo', 1)) break;
  }

  return shuffled.map((type) => {
    const item =
      type === 'go' ? GO_ITEMS[Math.floor(Math.random() * GO_ITEMS.length)] : NOGO_ITEM;
    return { type, ...item };
  });
}

function hasLongRun(arr: TrialType[], type: TrialType, maxRun: number): boolean {
  let run = 0;
  for (const item of arr) {
    run = item === type ? run + 1 : 0;
    if (run > maxRun) return true;
  }
  return false;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

export function ImpulseGame() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [phase, setPhase] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [stimulusFading, setStimulusFading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<'hit' | 'miss' | null>(null);

  const sequenceRef = useRef<Trial[]>([]);
  const resultsRef = useRef<TrialResult[]>([]);
  const respondedRef = useRef(false);
  const trialStartRef = useRef(0);

  const finishGame = useCallback(async () => {
    const results = resultsRef.current;
    const goResults = results.filter((r) => r.type === 'go');
    const nogoResults = results.filter((r) => r.type === 'nogo');

    const omissionErrors = goResults.filter((r) => !r.responded).length;
    const commissionErrors = nogoResults.filter((r) => r.responded).length;
    const reactionTimes = goResults
      .filter((r) => r.responded && r.reactionTimeMs !== null)
      .map((r) => r.reactionTimeMs as number);

    setSubmitting(true);
    try {
      await api.post('/impulse-game/submit', {
        goTotal: GO_TOTAL,
        omissionErrors,
        noGoTotal: NOGO_TOTAL,
        commissionErrors,
        avgReactionTimeMs: Math.round(mean(reactionTimes)),
        reactionTimeSdMs: Math.round(stdDev(reactionTimes)),
      });
    } finally {
      setSubmitting(false);
      setPhase('finished');
    }
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;

    respondedRef.current = false;
    trialStartRef.current = Date.now();
    setStimulusFading(false);
    setTapFeedback(null);

    const fadeTimer = setTimeout(() => setStimulusFading(true), STIMULUS_MS);

    const nextTimer = setTimeout(() => {
      const trial = sequenceRef.current[trialIndex];
      const result = resultsRef.current[trialIndex];
      if (!result) {
        resultsRef.current[trialIndex] = {
          type: trial.type,
          responded: respondedRef.current,
          reactionTimeMs: respondedRef.current ? Date.now() - trialStartRef.current : null,
        };
      }

      if (trialIndex + 1 < TOTAL_TRIALS) {
        setTrialIndex((i) => i + 1);
      } else {
        finishGame();
      }
    }, TRIAL_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nextTimer);
    };
  }, [phase, trialIndex, finishGame]);

  const handleStart = () => {
    sequenceRef.current = buildSequence();
    resultsRef.current = [];
    setTrialIndex(0);
    setPhase('playing');
  };

  const handleStageClick = () => {
    if (phase !== 'playing' || respondedRef.current) return;
    respondedRef.current = true;

    const trial = sequenceRef.current[trialIndex];
    resultsRef.current[trialIndex] = {
      type: trial.type,
      responded: true,
      reactionTimeMs: Date.now() - trialStartRef.current,
    };
    setTapFeedback(trial.type === 'go' ? 'hit' : 'miss');
  };

  const handleFinishAndNext = () => {
    navigate('/thanks');
  };

  if (phase === 'intro') {
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
            <div className="welcome-card__title">Tezkor maktabchi 🎒</div>
            <div className="welcome-card__subtitle">
              Endi yana bitta qiziqarli o'yin bor — diqqatingizni sinab ko'ramiz!
            </div>
          </div>
          <div className="welcome-card__hero">🎒</div>
        </div>

        <div className="impulse-instructions">
          <div className="impulse-instructions__row">
            <span className="impulse-items">
              {GO_ITEMS.map((item) => (
                <span className="impulse-item" key={item.label}>
                  <span className="impulse-item__emoji">{item.emoji}</span>
                  <span className="impulse-item__label">{item.label}</span>
                </span>
              ))}
            </span>
            <span>chiqsa — tezda ekranga bosing!</span>
          </div>
          <div className="impulse-instructions__row">
            <span className="impulse-items">
              <span className="impulse-item">
                <span className="impulse-item__emoji">{NOGO_ITEM.emoji}</span>
                <span className="impulse-item__label">{NOGO_ITEM.label}</span>
              </span>
            </span>
            <span>chiqsa — bosmang, qo'lingizni tegmang!</span>
          </div>
          <p className="muted">
            O'yin taxminan 2 daqiqa davom etadi. Tayyor bo'lsangiz, boshlaymiz!
          </p>
        </div>

        <div className="game-footer">
          <div className="game-hint">💡 Iloji boricha tez va diqqat bilan harakat qiling.</div>
          <button className="btn btn-primary game-next-btn" onClick={handleStart}>
            Boshlash →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="page page--center">
        <div className="card center register-card">
          <div className="result-star">🌟</div>
          <h2>Ajoyib!</h2>
          <p className="muted">Siz "Tezkor maktabchi" o'yinini muvaffaqiyatli yakunladingiz!</p>
          <button
            className="btn btn-primary"
            disabled={submitting}
            onClick={handleFinishAndNext}
          >
            Davom etish →
          </button>
        </div>
      </div>
    );
  }

  const trial = sequenceRef.current[trialIndex];
  const progress = Math.round(((trialIndex + 1) / TOTAL_TRIALS) * 100);

  return (
    <div className="page game-page">
      <div className="game-topbar">
        <div className="game-brand">
          <span className="game-brand__icon">🧠✨</span>
          <div>
            <div className="game-brand__title">AI PSIXOLOG</div>
            <div className="game-brand__subtitle">Tezkor maktabchi</div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-section__label">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div
        className={`impulse-stage${tapFeedback ? ` impulse-stage--${tapFeedback}` : ''}`}
        onClick={handleStageClick}
      >
        {trial && (
          <div
            className={`impulse-stage__item${stimulusFading ? ' impulse-stage__item--fading' : ''}`}
          >
            <span className="impulse-stage__emoji">{trial.emoji}</span>
            <span className="impulse-stage__label">{trial.label}</span>
          </div>
        )}
        {tapFeedback && (
          <span className="impulse-stage__feedback">{tapFeedback === 'hit' ? '✅' : '❌'}</span>
        )}
      </div>

      <div className="game-footer">
        <div className="game-hint">
          📚📓✏️🎒 — bos! &nbsp; {NOGO_ITEM.emoji} {NOGO_ITEM.label} — bosma!
        </div>
      </div>
    </div>
  );
}

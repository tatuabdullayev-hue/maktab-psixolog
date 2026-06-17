import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface GameItem { emoji: string; label: string; }

const GO_ITEMS: GameItem[] = [
  { emoji: '📚', label: 'Kitob' },
  { emoji: '📓', label: 'Daftar' },
  { emoji: '✏️', label: 'Ruchka' },
  { emoji: '🎒', label: 'Sumka' },
];
const NOGO_ITEM: GameItem = { emoji: '📵', label: 'Telefon' };

const GO_TOTAL    = 32;
const NOGO_TOTAL  = 8;
const TOTAL_TRIALS = GO_TOTAL + NOGO_TOTAL;
const STIMULUS_MS  = 500;
const BASE_TRIAL_MS = 2000;
const MIN_TRIAL_MS  = 1200;
const MAX_LIVES     = 3;

type TrialType = 'go' | 'nogo';
interface Trial extends GameItem { type: TrialType; }
interface TrialResult { type: TrialType; responded: boolean; reactionTimeMs: number | null; }

function buildSequence(): Trial[] {
  const types: TrialType[] = [
    ...Array(GO_TOTAL).fill('go' as const),
    ...Array(NOGO_TOTAL).fill('nogo' as const),
  ];
  let shuffled = types;
  for (let attempt = 0; attempt < 100; attempt++) {
    shuffled = [...types];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (!shuffled.some((t, i) => t === 'nogo' && shuffled[i + 1] === 'nogo')) break;
  }
  return shuffled.map(type => ({
    type,
    ...(type === 'go' ? GO_ITEMS[Math.floor(Math.random() * GO_ITEMS.length)] : NOGO_ITEM),
  }));
}

function mean(values: number[]) {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}
function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map(v => (v - m) ** 2)));
}

function getStars(accuracy: number, avgRt: number) {
  if (accuracy >= 90 && avgRt < 400) return 3;
  if (accuracy >= 75 && avgRt < 600) return 2;
  return 1;
}

function getRtLabel(ms: number) {
  if (ms < 280) return { text: '⚡ Juda tez!', color: '#7c3aed' };
  if (ms < 420) return { text: '🚀 Ajoyib!',  color: '#2563eb' };
  if (ms < 600) return { text: '👍 Yaxshi',   color: '#16a34a' };
  return           { text: '🐢 Sekinroq',    color: '#d97706' };
}

export function ImpulseGame() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [phase, setPhase]               = useState<'intro' | 'playing' | 'finished'>('intro');
  const [trialIndex, setTrialIndex]     = useState(0);
  const [stimulusFading, setStimulusFading] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [tapFeedback, setTapFeedback]   = useState<'hit' | 'miss' | null>(null);
  const [rtFeedback, setRtFeedback]     = useState<{ text: string; color: string } | null>(null);
  const [score, setScore]               = useState(0);
  const [scoreBump, setScoreBump]       = useState(false);
  const [, setStreak]                   = useState(0);
  const [comboMsg, setComboMsg]         = useState<string | null>(null);
  const [lives, setLives]               = useState(MAX_LIVES);
  const [trialMs, setTrialMs]           = useState(BASE_TRIAL_MS);

  // finish stats
  const [finalStats, setFinalStats] = useState<{
    accuracy: number; avgRt: number; stars: number;
  } | null>(null);

  const sequenceRef  = useRef<Trial[]>([]);
  const resultsRef   = useRef<TrialResult[]>([]);
  const respondedRef = useRef(false);
  const trialStartRef = useRef(0);
  const livesRef     = useRef(MAX_LIVES);
  const streakRef    = useRef(0);
  const scoreRef     = useRef(0);
  const trialMsRef   = useRef(BASE_TRIAL_MS);

  const finishGame = useCallback(async () => {
    const results = resultsRef.current;
    const goResults   = results.filter(r => r.type === 'go');
    const nogoResults = results.filter(r => r.type === 'nogo');
    const omissionErrors  = goResults.filter(r => !r.responded).length;
    const commissionErrors = nogoResults.filter(r => r.responded).length;
    const reactionTimes = goResults
      .filter(r => r.responded && r.reactionTimeMs !== null)
      .map(r => r.reactionTimeMs as number);

    const accuracy = Math.round(((GO_TOTAL - omissionErrors + NOGO_TOTAL - commissionErrors) / TOTAL_TRIALS) * 100);
    const avgRt    = Math.round(mean(reactionTimes));
    const stars    = getStars(accuracy, avgRt);
    setFinalStats({ accuracy, avgRt, stars });

    setSubmitting(true);
    try {
      await api.post('/impulse-game/submit', {
        goTotal: GO_TOTAL,
        omissionErrors,
        noGoTotal: NOGO_TOTAL,
        commissionErrors,
        avgReactionTimeMs: avgRt,
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
    setRtFeedback(null);
    setComboMsg(null);

    const currentTrialMs = trialMsRef.current;
    const fadeTimer = setTimeout(() => setStimulusFading(true), STIMULUS_MS);
    const nextTimer = setTimeout(() => {
      const trial = sequenceRef.current[trialIndex];
      if (!resultsRef.current[trialIndex]) {
        resultsRef.current[trialIndex] = {
          type: trial.type,
          responded: respondedRef.current,
          reactionTimeMs: null,
        };
      }
      if (trialIndex + 1 < TOTAL_TRIALS) {
        setTrialIndex(i => i + 1);
      } else {
        finishGame();
      }
    }, currentTrialMs);

    return () => { clearTimeout(fadeTimer); clearTimeout(nextTimer); };
  }, [phase, trialIndex, finishGame]);

  const handleStart = () => {
    sequenceRef.current = buildSequence();
    resultsRef.current  = [];
    livesRef.current    = MAX_LIVES;
    streakRef.current   = 0;
    scoreRef.current    = 0;
    trialMsRef.current  = BASE_TRIAL_MS;
    setTrialIndex(0);
    setScore(0);
    setStreak(0);
    setLives(MAX_LIVES);
    setTrialMs(BASE_TRIAL_MS);
    setPhase('playing');
  };

  const handleStageClick = () => {
    if (phase !== 'playing' || respondedRef.current) return;
    respondedRef.current = true;

    const trial = sequenceRef.current[trialIndex];
    const rt    = Date.now() - trialStartRef.current;
    resultsRef.current[trialIndex] = { type: trial.type, responded: true, reactionTimeMs: rt };

    const isHit = trial.type === 'go';
    setTapFeedback(isHit ? 'hit' : 'miss');

    if (isHit) {
      // score
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setScoreBump(true);
      setTimeout(() => setScoreBump(false), 200);

      // reaction time badge
      setRtFeedback(getRtLabel(rt));

      // streak
      streakRef.current += 1;
      setStreak(streakRef.current);
      if (streakRef.current === 3)  setComboMsg('🔥 x3 Combo!');
      else if (streakRef.current === 5)  setComboMsg('⚡ x5 Super!');
      else if (streakRef.current === 10) setComboMsg('🌟 x10 Ustoz!');

      // speed up every 10 correct
      if (scoreRef.current % 10 === 0) {
        const newMs = Math.max(MIN_TRIAL_MS, trialMsRef.current - 200);
        trialMsRef.current = newMs;
        setTrialMs(newMs);
      }
    } else {
      // miss (commission error) — lose a life
      streakRef.current = 0;
      setStreak(0);
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) {
        setTimeout(() => finishGame(), 400);
      }
    }
  };

  /* ── INTRO ── */
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
            <button className="btn-exit" onClick={() => { logout(); navigate('/'); }}>Chiqish</button>
          </div>
        </div>

        <div className="welcome-card">
          <div>
            <div className="welcome-card__title">Tezkor o'quvchi 🎒</div>
            <div className="welcome-card__subtitle">
              Diqqatingizni sinab ko'ramiz — iloji boricha tez va to'g'ri bosing!
            </div>
          </div>
          <div className="welcome-card__hero">🎒</div>
        </div>

        <div className="impulse-instructions">
          <div className="impulse-instructions__row">
            <span className="impulse-items">
              {GO_ITEMS.map(item => (
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
          <div className="impulse-rules">
            <span>❤️ 3 ta hayot bor — telefonga bossangiz bittasi ketadi</span>
            <span>🔥 Ketma-ket to'g'ri bossangiz combo ball to'planadi</span>
            <span>⚡ Qanchalik tez bossangiz, o'yin shunchalik tezlashadi</span>
          </div>
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

  /* ── FINISHED ── */
  if (phase === 'finished') {
    const stats = finalStats;
    const stars = stats?.stars ?? 1;
    return (
      <div className="page page--center">
        <div className="card center impulse-result-card">
          <div className="impulse-result-stars">
            {[1,2,3].map(n => (
              <span key={n} className={`impulse-result-star${n <= stars ? ' impulse-result-star--on' : ''}`}>⭐</span>
            ))}
          </div>
          <h2 className="impulse-result-title">
            {stars === 3 ? 'Mukammal!' : stars === 2 ? 'Yaxshi!' : 'Davom eting!'}
          </h2>
          {stats && (
            <div className="impulse-result-stats">
              <div className="impulse-result-stat">
                <span className="impulse-result-stat__val">{stats.accuracy}%</span>
                <span className="impulse-result-stat__label">Aniqlik</span>
              </div>
              <div className="impulse-result-stat">
                <span className="impulse-result-stat__val">{stats.avgRt > 0 ? `${stats.avgRt}ms` : '—'}</span>
                <span className="impulse-result-stat__label">O'rt. tezlik</span>
              </div>
              <div className="impulse-result-stat">
                <span className="impulse-result-stat__val">{scoreRef.current}</span>
                <span className="impulse-result-stat__label">To'g'ri bosish</span>
              </div>
            </div>
          )}
          <button
            className="btn btn-primary"
            disabled={submitting}
            onClick={() => navigate('/color-test')}
          >
            Davom etish →
          </button>
        </div>
      </div>
    );
  }

  /* ── PLAYING ── */
  const trial    = sequenceRef.current[trialIndex];
  const progress = Math.round(((trialIndex + 1) / TOTAL_TRIALS) * 100);

  return (
    <div className="page game-page">
      <div className="game-topbar">
        <div className="game-brand">
          <span className="game-brand__icon">🧠✨</span>
          <div>
            <div className="game-brand__title">AI PSIXOLOG</div>
            <div className="game-brand__subtitle">Tezkor o'quvchi</div>
          </div>
        </div>
        {/* Lives */}
        <div className="impulse-lives">
          {[...Array(MAX_LIVES)].map((_, i) => (
            <span key={i} className={`impulse-life${i < lives ? '' : ' impulse-life--lost'}`}>❤️</span>
          ))}
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
        {/* Score */}
        <span className={`impulse-score${scoreBump ? ' impulse-score--bump' : ''}`}>✓ {score}</span>

        {/* Combo */}
        {comboMsg && (
          <span key={comboMsg + trialIndex} className="impulse-combo">{comboMsg}</span>
        )}

        {/* RT feedback */}
        {rtFeedback && (
          <span key={'rt' + trialIndex} className="impulse-rt-badge" style={{ color: rtFeedback.color }}>
            {rtFeedback.text}
          </span>
        )}

        {trial && (
          <div
            key={trialIndex}
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
          {trialMs < BASE_TRIAL_MS && <span className="impulse-speed-badge">⚡ Tezlashdi!</span>}
        </div>
      </div>
    </div>
  );
}

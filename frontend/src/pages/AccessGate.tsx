import { useState, type ReactNode } from 'react';

const ACCESS_USERNAME = 'Chortoq2026';
const ACCESS_PASSWORD = 'Chortoq2026';
const STORAGE_KEY = 'student_access_ok';

export function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ACCESS_USERNAME && password === ACCESS_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
    } else {
      setError("Login yoki parol noto'g'ri");
    }
  };

  return (
    <div className="page page--center">
      <form className="card register-card" onSubmit={handleSubmit}>
        <div className="register-hero">🧠✨</div>
        <h1>AI Psixolog</h1>
        <p className="muted">Davom etish uchun kirish kodini kiriting</p>

        <label className="field">
          <span>Login</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Login" />
        </label>

        <label className="field">
          <span>Parol</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" type="submit">
          Kirish
        </button>
      </form>
    </div>
  );
}

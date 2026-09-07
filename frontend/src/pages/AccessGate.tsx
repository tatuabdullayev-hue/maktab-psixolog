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
      setError("Incorrect username or password");
    }
  };

  return (
    <div className="page page--center">
      <form className="card register-card" onSubmit={handleSubmit}>
        <div className="register-hero">🧠✨</div>
        <h1>AI Psychologist</h1>
        <p className="muted">Enter access credentials to continue</p>

        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" type="submit">
          Sign In
        </button>
      </form>
    </div>
  );
}

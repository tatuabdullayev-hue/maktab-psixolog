import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setFormError("Barcha maydonlarni to'ldiring");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch {
      setFormError("Login yoki parol noto'g'ri");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-hero">🧠✨</div>
        <h1>AI Psixolog</h1>
        <p className="muted">Psixolog kabineti — tizimga kiring</p>

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

        {formError && <p className="error">{formError}</p>}

        <button className="btn btn-primary" disabled={submitting} type="submit">
          {submitting ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}

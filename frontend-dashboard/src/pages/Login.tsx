import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [district, setDistrict] = useState('');

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password || !schoolName.trim() || !district.trim()) {
      setFormError("Barcha maydonlarni to'ldiring");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        schoolName: schoolName.trim(),
        district: district.trim(),
      });
      navigate('/');
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={mode === 'login' ? handleLogin : handleRegister}
      >
        <div className="login-hero">🧠✨</div>
        <h1>AI Psixolog</h1>
        <p className="muted">
          {mode === 'login'
            ? 'Psixolog kabineti — tizimga kiring'
            : 'Yangi kabinet yaratish'}
        </p>

        {mode === 'register' && (
          <label className="field">
            <span>Ism familiya</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dilshod Rahimov"
            />
          </label>
        )}

        <label className="field">
          <span>Login</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
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

        {mode === 'register' && (
          <>
            <label className="field">
              <span>Maktab raqami</span>
              <input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="53-maktab"
              />
            </label>

            <label className="field">
              <span>Tuman</span>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Chortoq tumani"
              />
            </label>
          </>
        )}

        {formError && <p className="error">{formError}</p>}

        <button className="btn btn-primary" disabled={submitting} type="submit">
          {submitting
            ? mode === 'login'
              ? 'Kirilmoqda...'
              : 'Yaratilmoqda...'
            : mode === 'login'
              ? 'Kirish'
              : 'Ro\'yxatdan o\'tish'}
        </button>

        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setFormError(null);
            setMode(mode === 'login' ? 'register' : 'login');
          }}
        >
          {mode === 'login'
            ? "Yangi kabinet yaratish"
            : 'Allaqachon kabinet bor — kirish'}
        </button>
      </form>
    </div>
  );
}

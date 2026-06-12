import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GRADES = [7, 8, 9, 10, 11];
const SECTIONS = ['A', 'B', 'C', 'D'];

const CLASS_OPTIONS = GRADES.flatMap((grade) =>
  SECTIONS.map((section) => `${grade}-${section}`),
);

export function Register() {
  const { registerWeb } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('53-maktab');
  const [district, setDistrict] = useState('Chortoq tumani');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = firstName.trim() && lastName.trim() && className;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await registerWeb({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        className,
        schoolName: schoolName.trim() || undefined,
        district: district.trim() || undefined,
      });
      navigate('/test');
    } catch {
      setFormError("Ro'yxatdan o'tishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--center">
      <div className="card register-card">
        <div className="register-hero">🧠✨</div>
        <h1>AI Psixolog</h1>
        <p className="muted">
          Sizni tushunamiz, sizga yordam beramiz. Boshlashdan oldin o'zingiz haqingizda
          ma'lumot kiriting.
        </p>

        <label className="field">
          <span>Ismingiz</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Masalan: Diyorbek"
          />
        </label>

        <label className="field">
          <span>Familiyangiz</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Masalan: Aliyev"
          />
        </label>

        <label className="field">
          <span>Sinfingiz</span>
          <select value={className} onChange={(e) => setClassName(e.target.value)}>
            <option value="">Sinfni tanlang</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Maktab</span>
          <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
        </label>

        <label className="field">
          <span>Tuman</span>
          <input value={district} onChange={(e) => setDistrict(e.target.value)} />
        </label>

        {formError && <p className="error">{formError}</p>}

        <button className="btn btn-primary" disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? 'Boshlanmoqda...' : 'Boshlash 🚀'}
        </button>
      </div>
    </div>
  );
}

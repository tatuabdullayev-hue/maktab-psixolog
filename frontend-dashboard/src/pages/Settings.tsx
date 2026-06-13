import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [schoolName, setSchoolName] = useState(user?.schoolName ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    if (!fullName.trim() || !schoolName.trim() || !district.trim()) {
      setProfileMessage({ type: 'error', text: "Barcha maydonlarni to'ldiring" });
      return;
    }
    setProfileSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        fullName: fullName.trim(),
        schoolName: schoolName.trim(),
        district: district.trim(),
      });
      updateUser(data);
      setProfileMessage({ type: 'success', text: '✓ Profil muvaffaqiyatli saqlandi' });
    } catch (e: any) {
      setProfileMessage({ type: 'error', text: e?.response?.data?.message || 'Xatolik yuz berdi' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: "Barcha maydonlarni to'ldiring" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Yangi parollar mos kelmadi' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak" });
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: '✓ Parol muvaffaqiyatli yangilandi' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordMessage({ type: 'error', text: e?.response?.data?.message || 'Xatolik yuz berdi' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="topbar">
        <h1 className="topbar__title">Sozlamalar</h1>
      </div>

      <div className="settings-profile-banner">
        <div className="settings-avatar">{getInitials(user?.fullName ?? 'P')}</div>
        <div>
          <div className="settings-profile-name">{user?.fullName}</div>
          <div className="settings-profile-meta">
            {user?.schoolName || 'Maktab kiritilmagan'} · {user?.district || 'Tuman kiritilmagan'}
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card settings-card">
          <div className="settings-card__header">
            <span className="settings-card__icon">👤</span>
            <div>
              <h2>Profil ma'lumotlari</h2>
              <p className="settings-card__subtitle">Shaxsiy va maktab ma'lumotlaringizni yangilang</p>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <div className="field">
              <span>F.I.Sh.</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <span>Maktab</span>
              <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
            </div>
            <div className="field">
              <span>Tuman</span>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
            {profileMessage && (
              <p className={profileMessage.type === 'error' ? 'error' : 'success'}>{profileMessage.text}</p>
            )}
            <button type="submit" className="btn btn-primary settings-submit" disabled={profileSaving}>
              {profileSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>
        </div>

        <div className="card settings-card">
          <div className="settings-card__header">
            <span className="settings-card__icon">🔒</span>
            <div>
              <h2>Parolni almashtirish</h2>
              <p className="settings-card__subtitle">Hisobingiz xavfsizligi uchun parolni yangilang</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="field">
              <span>Joriy parol</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <span>Yangi parol</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="field">
              <span>Yangi parolni tasdiqlang</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {passwordMessage && (
              <p className={passwordMessage.type === 'error' ? 'error' : 'success'}>{passwordMessage.text}</p>
            )}
            <button type="submit" className="btn btn-primary settings-submit" disabled={passwordSaving}>
              {passwordSaving ? 'Saqlanmoqda...' : 'Parolni yangilash'}
            </button>
          </form>
        </div>

        <div className="card settings-card settings-card--theme">
          <div className="settings-card__header">
            <span className="settings-card__icon">🎨</span>
            <div>
              <h2>Ko'rinish</h2>
              <p className="settings-card__subtitle">Sayt ko'rinishini tanlang</p>
            </div>
          </div>
          <div className="settings-theme-options">
            <button
              type="button"
              className={`settings-theme-option${theme === 'light' ? ' settings-theme-option--active' : ''}`}
              onClick={() => theme === 'dark' && toggleTheme()}
            >
              <span className="settings-theme-option__icon">☀️</span>
              <span>Yorug' rejim</span>
            </button>
            <button
              type="button"
              className={`settings-theme-option${theme === 'dark' ? ' settings-theme-option--active' : ''}`}
              onClick={() => theme === 'light' && toggleTheme()}
            >
              <span className="settings-theme-option__icon">🌙</span>
              <span>Qorong'u rejim</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

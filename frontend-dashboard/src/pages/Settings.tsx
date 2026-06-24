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
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: '🏠', label: 'Bosh sahifa' },
  { to: '/students', icon: '🎓', label: "O'quvchilar" },
  { to: '/risks', icon: '⚠️', label: 'Risklar' },
  { to: '/reports', icon: '📊', label: 'Hisobotlar' },
  { to: '/recommendations', icon: '💡', label: 'Tavsiyalar' },
  { to: '/settings', icon: '⚙️', label: 'Sozlamalar' },
  { to: '/help', icon: '❓', label: 'Yordam' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">🧠✨</span>
        <div>
          <div className="sidebar__brand-title">AI PSIXOLOG</div>
          <div className="sidebar__brand-subtitle">Psixolog kabineti</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              'sidebar__item' + (isActive ? ' sidebar__item--active' : '')
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">{user?.fullName ?? 'Psixolog'}</div>
        <button className="sidebar__logout" onClick={logout}>
          Chiqish
        </button>
      </div>
    </aside>
  );
}

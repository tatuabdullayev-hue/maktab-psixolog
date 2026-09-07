import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface ClassAccessItem {
  className: string;
  isActive: boolean;
}

export function ClassAccess() {
  const [classes, setClasses] = useState<ClassAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingClass, setSavingClass] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/class-access')
      .then(({ data }) => setClasses(data))
      .finally(() => setLoading(false));
  }, []);

  const toggleClass = async (className: string) => {
    const current = classes.find((c) => c.className === className);
    if (!current) return;
    const nextActive = !current.isActive;

    setSavingClass(className);
    setClasses((prev) =>
      prev.map((c) => (c.className === className ? { ...c, isActive: nextActive } : c)),
    );

    try {
      await api.patch('/class-access', { className, isActive: nextActive });
    } catch {
      setClasses((prev) =>
        prev.map((c) => (c.className === className ? { ...c, isActive: !nextActive } : c)),
      );
    } finally {
      setSavingClass(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="topbar">
        <h1 className="topbar__title">Class Access Control</h1>
      </div>

      <div className="card">
        <h2>Class List</h2>
        <p className="muted">
          Students in enabled classes can access the system and start the test. Students in
          disabled classes will see a "Session not active" message.
        </p>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <div className="class-access-grid">
            {classes.map((c) => (
              <div key={c.className} className="class-access-item">
                <span className="class-access-item__name">Grade {c.className}</span>
                <button
                  type="button"
                  className={`class-access-toggle${c.isActive ? ' class-access-toggle--active' : ''}`}
                  disabled={savingClass === c.className}
                  onClick={() => toggleClass(c.className)}
                  aria-pressed={c.isActive}
                >
                  <span className="class-access-toggle__knob" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

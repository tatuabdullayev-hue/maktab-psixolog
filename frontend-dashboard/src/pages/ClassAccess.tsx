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
        <h1 className="topbar__title">Mashg'ulotga ruhsat berish</h1>
      </div>

      <div className="card">
        <h2>Sinflar ro'yxati</h2>
        <p className="muted">
          Ruhsat berilgan sinflardagi o'quvchilar tizimga kirib testni boshlashi mumkin. Qolgan
          sinflarga "Hozircha mashg'ulot faol emas" degan xabar chiqadi.
        </p>

        {loading ? (
          <p className="muted">Yuklanmoqda...</p>
        ) : (
          <div className="class-access-grid">
            {classes.map((c) => (
              <div key={c.className} className="class-access-item">
                <span className="class-access-item__name">{c.className}-sinf</span>
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

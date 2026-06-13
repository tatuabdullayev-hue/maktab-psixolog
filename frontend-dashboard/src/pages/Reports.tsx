import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { exportOverviewToExcel, formatDate, type Overview } from './Dashboard';

export function Reports() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school, setSchool] = useState(user?.schoolName ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;
    if (date) params.date = date;

    api
      .get('/dashboard/overview', { params })
      .then(({ data }) => setOverview(data))
      .finally(() => setLoading(false));
  }, [school, district, date]);

  return (
    <div className="dashboard">
      <Topbar
        title="Hisobotlar"
        school={school}
        district={district}
        date={date}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Yuklanmoqda...</p>}

      {overview && (
        <div className="card placeholder-card">
          <h3>📄 Hisobot yaratish</h3>
          <p className="muted">
            {date ? `${formatDate(date)} sanasi` : 'Barcha sanalar'} bo'yicha natijalarni Excel
            formatida yuklab oling.
          </p>
          <button
            type="button"
            className="btn btn-export"
            disabled={overview.students.length === 0}
            onClick={() => exportOverviewToExcel(overview, date)}
          >
            ⬇️ Excel formatda yuklab olish
          </button>
        </div>
      )}
    </div>
  );
}

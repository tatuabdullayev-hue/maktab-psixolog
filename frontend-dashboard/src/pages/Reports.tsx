import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';
import { exportOverviewToExcel, formatDate, type Overview } from './Dashboard';

export function Reports() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school, setSchool] = useState('53-maktab');
  const [district, setDistrict] = useState('Chortoq tumani');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;
    if (date) params.date = date;

    api
      .get('/dashboard/overview', { params })
      .then(({ data }) => setOverview(data))
      .catch(() => setError("Ma'lumotlarni yuklashda xatolik yuz berdi"))
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
      {error && <p className="error">{error}</p>}

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

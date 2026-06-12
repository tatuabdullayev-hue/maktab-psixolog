import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import { Topbar } from '../components/Topbar';

interface ClassBreakdown {
  className: string;
  normal: number;
  attention: number;
  danger: number;
}

interface HighRiskStudent {
  id: string;
  fullName: string;
  className: string;
  level: 'normal' | 'attention' | 'danger';
  aiInsight: string | null;
  aiRecommendation: string | null;
  completedAt: string;
}

interface Overview {
  total: number;
  low: number;
  medium: number;
  high: number;
  lowPct: number;
  mediumPct: number;
  highPct: number;
  classBreakdown: ClassBreakdown[];
  highRiskStudents: HighRiskStudent[];
}

const LEVEL_LABELS: Record<string, string> = {
  normal: 'Past xavf',
  attention: "O'rta xavf",
  danger: 'Yuqori xavf',
};

const LEVEL_COLORS: Record<string, string> = {
  normal: '#22c55e',
  attention: '#f59e0b',
  danger: '#ef4444',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

export function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school, setSchool] = useState('');
  const [district, setDistrict] = useState('');
  const [date, setDate] = useState('');
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

  const pieData = overview
    ? [
        { name: 'Past xavf', value: overview.low, level: 'normal' },
        { name: "O'rta xavf", value: overview.medium, level: 'attention' },
        { name: 'Yuqori xavf', value: overview.high, level: 'danger' },
      ]
    : [];

  return (
    <div className="dashboard">
      <Topbar
        title="Bosh sahifa"
        school={school}
        district={district}
        date={date}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Yuklanmoqda...</p>}

      {overview && (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-card__label">Jami o'quvchilar</div>
              <div className="stat-card__value">{overview.total}</div>
            </div>
            <div className="stat-card stat-card--normal">
              <div className="stat-card__label">Past xavf</div>
              <div className="stat-card__value">{overview.low}</div>
              <div className="stat-card__pct">{overview.lowPct}%</div>
            </div>
            <div className="stat-card stat-card--attention">
              <div className="stat-card__label">O'rta xavf</div>
              <div className="stat-card__value">{overview.medium}</div>
              <div className="stat-card__pct">{overview.mediumPct}%</div>
            </div>
            <div className="stat-card stat-card--danger">
              <div className="stat-card__label">Yuqori xavf</div>
              <div className="stat-card__value">{overview.high}</div>
              <div className="stat-card__pct">{overview.highPct}%</div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h2>Risk taqsimoti</h2>
              {overview.total === 0 ? (
                <p className="muted">Ma'lumot yo'q</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.level} fill={LEVEL_COLORS[entry.level]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <h2>Sinflar kesimida</h2>
              {overview.classBreakdown.length === 0 ? (
                <p className="muted">Ma'lumot yo'q</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={overview.classBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="normal" name="Past" fill={LEVEL_COLORS.normal} stackId="a" />
                    <Bar dataKey="attention" name="O'rta" fill={LEVEL_COLORS.attention} stackId="a" />
                    <Bar dataKey="danger" name="Yuqori" fill={LEVEL_COLORS.danger} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <h2>Yuqori xavf guruhi</h2>
            {overview.highRiskStudents.length === 0 ? (
              <p className="muted">Hozircha e'tibor talab qiladigan o'quvchi yo'q</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>O'quvchi</th>
                    <th>Sinf</th>
                    <th>Daraja</th>
                    <th>AI tahlili</th>
                    <th>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.highRiskStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.fullName}</td>
                      <td>{s.className}</td>
                      <td>
                        <span className={`badge badge--${s.level}`}>{LEVEL_LABELS[s.level]}</span>
                      </td>
                      <td>{s.aiInsight}</td>
                      <td>{formatDate(s.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bottom-cards">
            <div className="card placeholder-card">
              <h3>🤖 AI tavsiyalar</h3>
              <p className="muted">Tez orada: AI asosida tavsiyalar generatori.</p>
            </div>
            <div className="card placeholder-card">
              <h3>📄 Hisobot yaratish</h3>
              <p className="muted">Tez orada: PDF/Excel hisobot eksporti.</p>
            </div>
            <div className="card placeholder-card">
              <h3>📈 Trendlar</h3>
              <p className="muted">Tez orada: vaqt bo'yicha dinamika tahlili.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

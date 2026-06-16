import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { NoteModal, Note, TYPE_LABELS } from '../components/NoteModal';
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
  CartesianGrid,
  AreaChart,
  Area,
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

export interface TestStudent {
  id: string;
  fullName: string;
  className: string;
  level: 'normal' | 'attention' | 'danger';
  aiInsight: string | null;
  aiRecommendation: string | null;
  completedAt: string;
}

interface TrendPoint {
  date: string;
  normal: number;
  attention: number;
  danger: number;
  total: number;
}

export interface Overview {
  total: number;
  low: number;
  medium: number;
  high: number;
  lowPct: number;
  mediumPct: number;
  highPct: number;
  classBreakdown: ClassBreakdown[];
  highRiskStudents: HighRiskStudent[];
  students: TestStudent[];
}

type LevelFilter = 'all' | 'normal' | 'attention' | 'danger';

const FILTER_TITLES: Record<LevelFilter, string> = {
  all: "Test topshirgan o'quvchilar",
  normal: 'Past xavf guruhi',
  attention: "O'rta xavf guruhi",
  danger: 'Yuqori xavf guruhi',
};

export const LEVEL_LABELS: Record<string, string> = {
  normal: 'Past xavf',
  attention: "O'rta xavf",
  danger: 'Yuqori xavf',
};

const LEVEL_COLORS: Record<string, string> = {
  normal: '#22c55e',
  attention: '#f59e0b',
  danger: '#ef4444',
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
}

export function exportOverviewToExcel(overview: Overview, date: string) {
  const rows = overview.students.map((s, i) => ({
    '№': i + 1,
    "O'quvchi": s.fullName,
    Sinf: s.className,
    Daraja: LEVEL_LABELS[s.level],
    "AI tahlili": s.aiInsight ?? '',
    "AI tavsiyasi": s.aiRecommendation ?? '',
    Sana: formatDate(s.completedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 24 },
    { wch: 10 },
    { wch: 12 },
    { wch: 50 },
    { wch: 50 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hisobot');

  const fileName = date ? `hisobot_${date}.xlsx` : 'hisobot_barcha_sanalar.xlsx';
  XLSX.writeFile(workbook, fileName);
}

function MiniTrend({ data, dataKey, color }: { data: TrendPoint[]; dataKey: keyof TrendPoint; color: string }) {
  if (!data.length || data.every((d) => d[dataKey] === 0)) return null;
  return (
    <div className="stat-card__spark">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.18}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [school, setSchool] = useState('53-maktab');
  const [district, setDistrict] = useState('Chortoq tumani');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string } | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);

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

  useEffect(() => {
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;

    api.get('/dashboard/trends', { params }).then(({ data }) => setTrends(data));
  }, [school, district]);

  const loadNotes = () => {
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;
    api.get('/notes', { params }).then(({ data }) => setAllNotes(data));
  };

  useEffect(() => { loadNotes(); }, [school, district]);

  const pieData = overview
    ? [
        { name: 'Past xavf', value: overview.low, level: 'normal' },
        { name: "O'rta xavf", value: overview.medium, level: 'attention' },
        { name: 'Yuqori xavf', value: overview.high, level: 'danger' },
      ]
    : [];
  const pieSlices = pieData.map((entry) => ({ ...entry, value: entry.value > 0 ? entry.value : 0.0001 }));
  const PCT_MAP: Record<string, number> = overview
    ? { normal: overview.lowPct, attention: overview.mediumPct, danger: overview.highPct }
    : {};

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
      {error && <p className="error">{error}</p>}

      {overview && (
        <>
          <div className="stat-cards">
            <button
              type="button"
              className={`stat-card stat-card--clickable${selectedLevel === 'all' ? ' stat-card--active' : ''}`}
              onClick={() => setSelectedLevel(selectedLevel === 'all' ? null : 'all')}
            >
              <span className="stat-card__menu">⋮</span>
              <div className="stat-card__icon stat-card__icon--total">👥</div>
              <div className="stat-card__body">
                <div className="stat-card__label">Jami o'quvchilar</div>
                <div className="stat-card__value">{overview.total}</div>
              </div>
              <MiniTrend data={trends} dataKey="total" color="#6d4ce0" />
            </button>
            <button
              type="button"
              className={`stat-card stat-card--normal stat-card--clickable${selectedLevel === 'normal' ? ' stat-card--active' : ''}`}
              onClick={() => setSelectedLevel(selectedLevel === 'normal' ? null : 'normal')}
            >
              <span className="stat-card__menu">⋮</span>
              <div className="stat-card__icon stat-card__icon--normal">🟢</div>
              <div className="stat-card__body">
                <div className="stat-card__label">Past xavf</div>
                <div className="stat-card__value">{overview.low}</div>
                <div className="stat-card__pct">jami o'quvchilarning {overview.lowPct}%i</div>
              </div>
              <MiniTrend data={trends} dataKey="normal" color={LEVEL_COLORS.normal} />
            </button>
            <button
              type="button"
              className={`stat-card stat-card--attention stat-card--clickable${selectedLevel === 'attention' ? ' stat-card--active' : ''}`}
              onClick={() => setSelectedLevel(selectedLevel === 'attention' ? null : 'attention')}
            >
              <span className="stat-card__menu">⋮</span>
              <div className="stat-card__icon stat-card__icon--attention">🟡</div>
              <div className="stat-card__body">
                <div className="stat-card__label">O'rta xavf</div>
                <div className="stat-card__value">{overview.medium}</div>
                <div className="stat-card__pct">jami o'quvchilarning {overview.mediumPct}%i</div>
              </div>
              <MiniTrend data={trends} dataKey="attention" color={LEVEL_COLORS.attention} />
            </button>
            <button
              type="button"
              className={`stat-card stat-card--danger stat-card--clickable${selectedLevel === 'danger' ? ' stat-card--active' : ''}`}
              onClick={() => setSelectedLevel(selectedLevel === 'danger' ? null : 'danger')}
            >
              <span className="stat-card__menu">⋮</span>
              <div className="stat-card__icon stat-card__icon--danger">🔴</div>
              <div className="stat-card__body">
                <div className="stat-card__label">Yuqori xavf</div>
                <div className="stat-card__value">{overview.high}</div>
                <div className="stat-card__pct">jami o'quvchilarning {overview.highPct}%i</div>
              </div>
              <MiniTrend data={trends} dataKey="danger" color={LEVEL_COLORS.danger} />
            </button>
          </div>

          {selectedLevel && (
            <div className="card">
              <h2>{FILTER_TITLES[selectedLevel]}</h2>
              {(() => {
                const list =
                  selectedLevel === 'all'
                    ? overview.students
                    : overview.students.filter((s) => s.level === selectedLevel);
                return list.length === 0 ? (
                  <p className="muted">Bu guruhda o'quvchi yo'q</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>O'quvchi</th>
                        <th>Sinf</th>
                        <th>Daraja</th>
                        <th>Sana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((s) => (
                        <tr key={s.id}>
                          <td>{s.fullName}</td>
                          <td>{s.className}</td>
                          <td>
                            <span className={`badge badge--${s.level}`}>{LEVEL_LABELS[s.level]}</span>
                          </td>
                          <td>{formatDate(s.completedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-card__header">
                <h2>Risk taqsimoti</h2>
                <p className="chart-card__subtitle">Barcha o'quvchilar bo'yicha xavf darajalari</p>
              </div>
              {overview.total === 0 ? (
                <p className="muted">Ma'lumot yo'q</p>
              ) : (
                <div className="risk-distribution">
                  <div className="donut-wrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieSlices}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          cornerRadius={6}
                          stroke="none"
                          isAnimationActive={false}
                        >
                          {pieSlices.map((entry) => (
                            <Cell key={entry.level} fill={LEVEL_COLORS[entry.level]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => (Number(value) < 1 ? 0 : value)}
                          contentStyle={{ borderRadius: 10, border: '1px solid #ececf3', fontSize: 13 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <div className="donut-center__value">{overview.total}</div>
                      <div className="donut-center__label">jami</div>
                    </div>
                  </div>
                  <div className="risk-legend-table">
                    {pieData.map((entry) => (
                      <div className="risk-legend-row" key={entry.level}>
                        <div className="risk-legend-row__left">
                          <span
                            className="chart-legend__dot"
                            style={{ background: LEVEL_COLORS[entry.level] }}
                          />
                          <span className="chart-legend__name">{entry.name}</span>
                        </div>
                        <div className="risk-legend-row__right">
                          <span className="risk-legend-row__value">{entry.value}</span>
                          <span className="risk-legend-row__pct">{PCT_MAP[entry.level]}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card__header">
                <h2>Sinflar kesimida</h2>
                <p className="chart-card__subtitle">Har bir sinfdagi xavf darajalari taqsimoti</p>
              </div>
              {overview.classBreakdown.length === 0 ? (
                <p className="muted">Ma'lumot yo'q</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={overview.classBreakdown} barCategoryGap="28%">
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis
                      dataKey="className"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9c99ad' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9c99ad' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(109, 76, 224, 0.06)' }}
                      contentStyle={{ borderRadius: 10, border: '1px solid #ececf3', fontSize: 13 }}
                    />
                    <Bar dataKey="normal" name="Past" fill={LEVEL_COLORS.normal} stackId="a" radius={[0, 0, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                    <Bar dataKey="attention" name="O'rta" fill={LEVEL_COLORS.attention} stackId="a" maxBarSize={36} isAnimationActive={false} />
                    <Bar dataKey="danger" name="Yuqori" fill={LEVEL_COLORS.danger} stackId="a" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="chart-legend">
                <div className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ background: LEVEL_COLORS.normal }} />
                  <span className="chart-legend__name">Past xavf</span>
                </div>
                <div className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ background: LEVEL_COLORS.attention }} />
                  <span className="chart-legend__name">O'rta xavf</span>
                </div>
                <div className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ background: LEVEL_COLORS.danger }} />
                  <span className="chart-legend__name">Yuqori xavf</span>
                </div>
              </div>
            </div>
          </div>

          {!selectedLevel && <div className="card">
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
                    <th>Ish</th>
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
                      <td>
                        <button
                          type="button"
                          className="btn-note"
                          onClick={() => setNoteTarget({ id: s.id, name: s.fullName })}
                        >
                          📝 Ish qo'shish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>}

          <div className="card">
            <h2>Psixolog ishi jurnali</h2>
            <p className="chart-card__subtitle">Barcha sanalar bo'yicha qilingan ishlar</p>
            {allNotes.length === 0 ? (
              <p className="muted">Hali hech qanday ish kiritilmagan</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>O'quvchi</th>
                    <th>Sinf</th>
                    <th>Ish turi</th>
                    <th>Tavsif</th>
                    <th>Keyingi qadam</th>
                  </tr>
                </thead>
                <tbody>
                  {allNotes.map((n) => (
                    <tr key={n.id}>
                      <td>{new Date(n.createdAt).toLocaleDateString('uz-UZ')}</td>
                      <td>
                        {n.student
                          ? `${n.student.firstName} ${n.student.lastName ?? ''}`
                          : '—'}
                      </td>
                      <td>{n.student?.className ?? '—'}</td>
                      <td>{TYPE_LABELS[n.type] ?? n.type}</td>
                      <td>{n.note}</td>
                      <td>{n.nextStep ?? '—'}</td>
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
              <p className="muted">
                {date ? `${formatDate(date)} sanasi` : 'Barcha sanalar'} bo'yicha
                natijalarni Excel formatida yuklab oling.
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
            <div className="card placeholder-card trend-card">
              <h3>📈 Trendlar</h3>
              <p className="muted">Oxirgi 14 kunlik dinamika.</p>
              {trends.every((t) => t.total === 0) ? (
                <p className="muted">Ma'lumot yo'q</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={trends}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f5" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9c99ad' }}
                      minTickGap={20}
                    />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9c99ad' }} width={24} />
                    <Tooltip
                      labelFormatter={(label) => formatShortDate(String(label))}
                      contentStyle={{ borderRadius: 10, border: '1px solid #ececf3', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="normal" name={LEVEL_LABELS.normal} stackId="1" stroke={LEVEL_COLORS.normal} fill={LEVEL_COLORS.normal} fillOpacity={0.25} isAnimationActive={false} />
                    <Area type="monotone" dataKey="attention" name={LEVEL_LABELS.attention} stackId="1" stroke={LEVEL_COLORS.attention} fill={LEVEL_COLORS.attention} fillOpacity={0.25} isAnimationActive={false} />
                    <Area type="monotone" dataKey="danger" name={LEVEL_LABELS.danger} stackId="1" stroke={LEVEL_COLORS.danger} fill={LEVEL_COLORS.danger} fillOpacity={0.25} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {noteTarget && (
        <NoteModal
          studentId={noteTarget.id}
          studentName={noteTarget.name}
          onClose={() => setNoteTarget(null)}
          onSaved={loadNotes}
        />
      )}
    </div>
  );
}

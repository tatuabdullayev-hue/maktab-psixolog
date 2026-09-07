import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { NoteModal, TYPE_LABELS } from '../components/NoteModal';
import type { Note } from '../components/NoteModal';
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
import { useNotifications } from '../context/NotificationContext';

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
  all: "Students who completed the test",
  normal: 'Low Risk Group',
  attention: 'Medium Risk Group',
  danger: 'High Risk Group',
};

export const LEVEL_LABELS: Record<string, string> = {
  normal: 'Low Risk',
  attention: 'Medium Risk',
  danger: 'High Risk',
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
    '#': i + 1,
    'Student': s.fullName,
    Class: s.className,
    Level: LEVEL_LABELS[s.level],
    'AI Analysis': s.aiInsight ?? '',
    'AI Recommendation': s.aiRecommendation ?? '',
    Date: formatDate(s.completedAt),
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  const fileName = date ? `report_${date}.xlsx` : 'report_all_dates.xlsx';
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
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string; className?: string } | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const { refresh: refreshBadge } = useNotifications();

  const loadOverview = () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (school) params.school = school;
    if (district) params.district = district;
    if (date) params.date = date;

    api
      .get('/dashboard/overview', { params })
      .then(({ data }) => setOverview(data))
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOverview(); }, [school, district, date]);

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
        title="Dashboard"
        school={school}
        district={district}
        date={date}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        onDateChange={setDate}
      />

      {loading && <p className="muted">Loading...</p>}
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
                <div className="stat-card__label">Total Students</div>
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
                <div className="stat-card__label">Low Risk</div>
                <div className="stat-card__value">{overview.low}</div>
                <div className="stat-card__pct">{overview.lowPct}% of all students</div>
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
                <div className="stat-card__label">Medium Risk</div>
                <div className="stat-card__value">{overview.medium}</div>
                <div className="stat-card__pct">{overview.mediumPct}% of all students</div>
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
                <div className="stat-card__label">High Risk</div>
                <div className="stat-card__value">{overview.high}</div>
                <div className="stat-card__pct">{overview.highPct}% of all students</div>
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
                  <p className="muted">No students in this group</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Level</th>
                        <th>AI Analysis</th>
                        <th>Date</th>
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
                          <td style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 340 }}>
                            {s.aiInsight ?? '—'}
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
                <h2>Risk Distribution</h2>
                <p className="chart-card__subtitle">Risk levels across all students</p>
              </div>
              {overview.total === 0 ? (
                <p className="muted">No data available</p>
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
                      <div className="donut-center__label">total</div>
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
                <h2>By Class</h2>
                <p className="chart-card__subtitle">Risk level distribution per class</p>
              </div>
              {overview.classBreakdown.length === 0 ? (
                <p className="muted">No data available</p>
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
                    <Bar dataKey="normal" name="Low" fill={LEVEL_COLORS.normal} stackId="a" radius={[0, 0, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                    <Bar dataKey="attention" name="Medium" fill={LEVEL_COLORS.attention} stackId="a" maxBarSize={36} isAnimationActive={false} />
                    <Bar dataKey="danger" name="High" fill={LEVEL_COLORS.danger} stackId="a" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="chart-legend">
                <div className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ background: LEVEL_COLORS.normal }} />
                  <span className="chart-legend__name">Low Risk</span>
                </div>
                <div className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ background: LEVEL_COLORS.attention }} />
                  <span className="chart-legend__name">Medium Risk</span>
                </div>
                <div className="chart-legend__item">
                  <span className="chart-legend__dot" style={{ background: LEVEL_COLORS.danger }} />
                  <span className="chart-legend__name">High Risk</span>
                </div>
              </div>
            </div>
          </div>

          {!selectedLevel && <div className="card">
            <h2>High Risk Group</h2>
            {overview.highRiskStudents.length === 0 ? (
              <p className="muted">No students requiring attention at this time</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Level</th>
                    <th>AI Analysis</th>
                    <th>Last Action</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {overview.highRiskStudents.map((s) => {
                    const lastNote = allNotes.find((n) => n.studentId === s.id);
                    return (
                    <tr key={s.id}>
                      <td>{s.fullName}</td>
                      <td>{s.className}</td>
                      <td>
                        <span className={`badge badge--${s.level}`}>{LEVEL_LABELS[s.level]}</span>
                      </td>
                      <td>{s.aiInsight}</td>
                      <td>
                        {lastNote ? (
                          <span className="note-inline">
                            <span className="note-inline__type">{TYPE_LABELS[lastNote.type]}</span>
                            <span className="note-inline__text">{lastNote.note}</span>
                          </span>
                        ) : (
                          <span className="muted" style={{ fontSize: 12 }}>No actions logged</span>
                        )}
                      </td>
                      <td>{formatDate(s.completedAt)}</td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-note"
                          onClick={() => setNoteTarget({ id: s.id, name: s.fullName, className: s.className })}
                        >
                          📝 Add Action
                        </button>
                        <button
                          type="button"
                          className="btn-note btn-note--finish"
                          onClick={async () => {
                            if (!window.confirm(`Mark work with ${s.fullName} as complete?`)) return;
                            await api.post('/notes', {
                              studentId: s.id,
                              type: 'other',
                              note: "[NAZORAT_CHIQISH] Work completed by psychologist",
                              nextStep: "Monitoring concluded",
                            });
                            loadOverview();
                            loadNotes();
                          }}
                        >
                          ✅ Complete
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>}

          <div className="card">
            <h2>Psychologist Work Journal</h2>
            <p className="chart-card__subtitle">All logged actions across all dates</p>
            {allNotes.length === 0 ? (
              <p className="muted">No actions logged yet</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Next Step</th>
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
            <AiAdviceCard school={school} district={district} overview={overview} />
            <div className="card placeholder-card">
              <h3>📄 Generate Report</h3>
              <p className="muted">
                Download results {date ? `for ${formatDate(date)}` : 'for all dates'} in Excel format.
              </p>
              <button
                type="button"
                className="btn btn-export"
                disabled={overview.students.length === 0}
                onClick={() => exportOverviewToExcel(overview, date)}
              >
                ⬇️ Download Excel
              </button>
            </div>
            <div className="card placeholder-card trend-card">
              <h3>📈 Trends</h3>
              <p className="muted">Last 14 days dynamics.</p>
              {trends.every((t) => t.total === 0) ? (
                <p className="muted">No data available</p>
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
          studentClass={noteTarget.className}
          onClose={() => setNoteTarget(null)}
          onSaved={() => { loadNotes(); refreshBadge(); }}
        />
      )}
    </div>
  );
}

function AiAdviceCard({ school, district, overview }: { school: string; district: string; overview: Overview }) {
  const [expanded, setExpanded] = useState(false);
  const [advice, setAdvice]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const dangerPct = overview.total ? Math.round((overview.high / overview.total) * 100) : 0;
  const topClass  = [...overview.classBreakdown].sort((a, b) => b.danger - a.danger)[0];

  const summary = overview.high === 0
    ? "No high-risk students at this time — situation is stable."
    : `${overview.high} student(s) in the high-risk group (${dangerPct}%).${topClass?.danger > 0 ? ` Highest: Class ${topClass.className}.` : ''}`;

  const handleExpand = async () => {
    setExpanded(true);
    if (advice) return;
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/advice', { params: { school, district } });
      setAdvice(data.advice);
    } catch {
      setAdvice("Failed to load recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isGood = overview.high === 0;

  return (
    <div className={`ai-advice-card${expanded ? ' ai-advice-card--expanded' : ''}`}>
      {/* gradient top strip */}
      <div className="ai-advice-card__strip" />

      <div className="ai-advice-card__top">
        <div className="ai-advice-card__icon-wrap">
          <span className="ai-advice-card__robot">🤖</span>
        </div>
        <div className="ai-advice-card__title-block">
          <span className="ai-advice-card__label">AI Recommendations</span>
          <span className={`ai-advice-card__badge ${isGood ? 'ai-advice-card__badge--good' : 'ai-advice-card__badge--warn'}`}>
            {isGood ? '✓ Stable' : `⚠ ${overview.high} at risk`}
          </span>
        </div>
        <button
          type="button"
          className={`ai-advice-card__toggle${expanded ? ' ai-advice-card__toggle--open' : ''}`}
          onClick={expanded ? () => setExpanded(false) : handleExpand}
        >
          {expanded ? '✕' : 'Details'}
        </button>
      </div>

      <p className="ai-advice-card__summary">{summary}</p>

      {expanded && (
        <div className="ai-advice-card__body">
          {loading ? (
            <div className="ai-advice-card__loading">
              <span className="ai-advice-card__spinner" />
              <span>Preparing AI recommendations…</span>
            </div>
          ) : advice ? (
            <ul className="ai-advice-card__list">
              {advice.split('\n').filter(Boolean).map((line, i) => (
                <li key={i}>{line.replace(/^[•\-*]\s*/, '')}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

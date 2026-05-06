import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { apiService } from '../../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const C = {
  green:  { solid: '#1D9E75', light: 'rgba(29,158,117,0.12)', dark: '#0F6E56' },
  amber:  { solid: '#EF9F27', light: 'rgba(239,159,39,0.15)' },
  red:    { solid: '#E24B4A', light: 'rgba(226,75,74,0.12)'  },
  blue:   { solid: '#378ADD', light: 'rgba(55,138,221,0.12)' },
  purple: { solid: '#7F77DD' },
  coral:  { solid: '#D85A30' },
  gray:   { text: '#6B7280', border: '#E5E7EB', bg: '#F9FAFB', dark: '#374151' }
};

const TYPE_COLORS = [C.blue.solid, C.green.solid, C.amber.solid, C.red.solid, C.purple.solid, C.coral.solid];

const TASK_TYPE_ICONS = {
  watering:    '💧',
  fertilizing: '🌿',
  pruning:     '✂️',
  repotting:   '🪴',
  pest_control:'🐛',
  other:       '📋',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.92)',
  padding: 10,
  cornerRadius: 8,
  titleFont: { size: 12 },
  bodyFont: { size: 12 },
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
};

// Build full 30-day added-plants series from recentActivity
function buildActivitySeries(recentActivity) {
  const now = new Date();
  const map = {};
  (recentActivity || []).forEach(r => { map[r.date] = parseInt(r.count, 10); });
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return { label, value: map[key] || 0 };
  });
}

// Build 14-day upcoming tasks series
function buildUpcomingSeries(tasks) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today'
      : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayTasks = tasks.filter(t => !t.completed && t.due_date?.split('T')[0] === key);
    return { key, label, count: dayTasks.length, tasks: dayTasks };
  });
}

function countOverdue(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.filter(t => {
    if (t.completed || !t.due_date) return false;
    return new Date(t.due_date.split('T')[0]) < today;
  }).length;
}

const AnalyticsChart = ({ showNotification }) => {
  const [loading, setLoading]     = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks]         = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [analyticsRes, tasksRes] = await Promise.all([
        apiService.getAnalytics(),
        apiService.getTasks(),
      ]);
      if (!analyticsRes.success) throw new Error(analyticsRes.message || 'Failed to load analytics');
      if (!tasksRes.success)     throw new Error(tasksRes.message   || 'Failed to load tasks');
      setAnalytics(analyticsRes.data);
      setTasks(tasksRes.data || []);
    } catch (err) {
      showNotification?.('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={s.card}>
      <div style={s.cardHeader}><span style={s.cardTitle}>Plant Analytics</span></div>
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={{ color: C.gray.text, fontSize: 13, marginTop: 12 }}>Loading analytics…</p>
      </div>
    </div>
  );

  if (!analytics) return null;

  const { totalPlants, favorites, healthyPlants, types, statuses, recentActivity } = analytics;

  // ── TASK STATS ────────────────────────────────────────────────
  const pendingTasks   = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const overdue        = countOverdue(tasks);
  const todayStr       = new Date().toISOString().split('T')[0];
  const dueToday       = pendingTasks.filter(t => t.due_date?.split('T')[0] === todayStr).length;
  const upcomingSeries = buildUpcomingSeries(tasks);
  const totalUpcoming  = upcomingSeries.reduce((a, b) => a + b.count, 0);

  const taskTypeCounts = pendingTasks.reduce((acc, t) => {
    const type = t.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // ── STAT CARDS ────────────────────────────────────────────────
  const warningCount = parseInt(statuses.find(x => x.status === 'warning')?.count || 0, 10);
  const dangerCount  = parseInt(statuses.find(x => x.status === 'danger')?.count  || 0, 10);

  const stats = [
    { label: 'Total plants',    value: totalPlants,          sub: `${types.length} species`,                                                          color: C.blue.solid   },
    { label: 'Healthy',         value: healthyPlants,        sub: `${totalPlants ? Math.round(healthyPlants / totalPlants * 100) : 0}% of collection`, color: C.green.solid  },
    { label: 'Pending tasks',   value: pendingTasks.length,  sub: overdue > 0 ? `${overdue} overdue` : `${dueToday} due today`,                       color: overdue > 0 ? C.red.solid : C.amber.solid },
    { label: 'Completed tasks', value: completedTasks.length,sub: tasks.length > 0 ? `${Math.round(completedTasks.length / tasks.length * 100)}% done` : '—', color: C.purple.solid },
  ];

  // ── ADDED PLANTS LINE CHART (30 days, unchanged) ──────────────
  const activitySeries = buildActivitySeries(recentActivity);
  const totalAdded     = activitySeries.reduce((a, b) => a + b.value, 0);

  const activityChartData = {
    labels: activitySeries.map(d => d.label),
    datasets: [{
      label: 'Plants added',
      data: activitySeries.map(d => d.value),
      borderColor: C.green.solid,
      backgroundColor: C.green.light,
      tension: 0.4,
      fill: true,
      pointRadius: activitySeries.map(d => d.value > 0 ? 4 : 0),
      pointBackgroundColor: C.green.solid,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 7,
    }]
  };

  const activityOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_STYLE,
        callbacks: {
          title: ctx => activitySeries[ctx[0].dataIndex]?.label || '',
          label: ctx => ` ${ctx.raw} plant${ctx.raw !== 1 ? 's' : ''} added`,
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: C.gray.text, font: { size: 10 }, maxRotation: 0, autoSkip: false,
          callback: (_, i) => i % 5 === 0 ? activitySeries[i]?.label : ''
        }
      },
      y: { beginAtZero: true, grid: { color: C.gray.border }, ticks: { color: C.gray.text, font: { size: 11 }, stepSize: 1, precision: 0 } }
    }
  };

  // ── TYPE BAR CHART ────────────────────────────────────────────
  const typeChartData = {
    labels: types.map(t => t.type.charAt(0).toUpperCase() + t.type.slice(1)),
    datasets: [{
      label: 'Plants',
      data: types.map(t => parseInt(t.count, 10)),
      backgroundColor: types.map((_, i) => TYPE_COLORS[i % TYPE_COLORS.length]),
      borderRadius: 6, borderSkipped: false,
    }]
  };

  const typeOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_STYLE, callbacks: { label: ctx => ` ${ctx.raw} plant${ctx.raw !== 1 ? 's' : ''}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.gray.text, font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: C.gray.border }, ticks: { color: C.gray.text, stepSize: 1, precision: 0 } }
    }
  };

  // ── UPCOMING TASKS LINE CHART (replaces health doughnut) ──────
  const upcomingChartData = {
    labels: upcomingSeries.map(b => b.label),
    datasets: [{
      label: 'Tasks due',
      data: upcomingSeries.map(b => b.count),
      borderColor: C.amber.solid,
      backgroundColor: C.amber.light,
      tension: 0.4,
      fill: true,
      pointRadius: upcomingSeries.map(b => b.count > 0 ? 5 : 0),
      pointBackgroundColor: upcomingSeries.map(b => b.count > 0 ? C.amber.solid : 'transparent'),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 7,
    }]
  };

  const upcomingOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_STYLE,
        callbacks: {
          title: ctx => upcomingSeries[ctx[0].dataIndex]?.label || '',
          label: ctx => ` ${ctx.raw} task${ctx.raw !== 1 ? 's' : ''} due`,
          afterBody: ctx => {
            const bucket = upcomingSeries[ctx[0].dataIndex];
            if (!bucket?.tasks?.length) return [];
            return ['', ...bucket.tasks.slice(0, 4).map(t =>
              `  ${TASK_TYPE_ICONS[t.type] || '📋'} ${t.plant_name || 'General'}: ${t.title}`
            )];
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: C.gray.text, font: { size: 10 }, maxRotation: 35, autoSkip: false,
          callback: (_, i) => {
            if (i === 0 || i === 1) return upcomingSeries[i]?.label;
            return i % 3 === 0 ? upcomingSeries[i]?.label : '';
          }
        }
      },
      y: { beginAtZero: true, grid: { color: C.gray.border }, ticks: { color: C.gray.text, font: { size: 11 }, stepSize: 1, precision: 0 } }
    }
  };

  // ── TIP ───────────────────────────────────────────────────────
  let tip = 'Everything looks good — all caught up!';
  if (overdue > 0)          tip = `${overdue} task${overdue > 1 ? 's are' : ' is'} overdue — take care of them first.`;
  else if (dueToday > 0)    tip = `${dueToday} task${dueToday > 1 ? 's are' : ' is'} due today.`;
  else if (dangerCount > 0) tip = `${dangerCount} plant${dangerCount > 1 ? 's need' : ' needs'} urgent attention.`;
  else if (totalUpcoming === 0 && pendingTasks.length === 0) tip = 'No upcoming tasks. Add care tasks to track your plant routine.';

  return (
    <div style={s.card}>

      {/* HEADER */}
      <div style={s.cardHeader}>
        <div>
          <span style={s.cardTitle}>Plant Analytics</span>
          <span style={s.cardSub}>{totalPlants} plants · {tasks.length} total tasks</span>
        </div>
        <button style={s.refreshBtn} onClick={load} title="Refresh">↻</button>
      </div>

      {/* STAT CARDS */}
      <div style={s.statsGrid}>
        {stats.map((st, i) => (
          <div key={i} style={s.statCard}>
            <div style={{ ...s.statVal, color: st.color }}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
            <div style={s.statSub}>{st.sub}</div>
          </div>
        ))}
      </div>

      {/* ADDED PLANTS — 30 days (unchanged) */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Plants added — last 30 days</span>
          <span style={{ ...s.badge, background: C.green.light, color: C.green.dark }}>{totalAdded} total</span>
        </div>
        <div style={{ height: 200 }}>
          <Line data={activityChartData} options={activityOptions} />
        </div>
      </div>

      {/* BOTTOM ROW: plant types + upcoming tasks */}
      <div style={s.bottomRow}>

        {/* Plant types bar chart */}
        <div style={s.miniCard}>
          <span style={s.sectionTitle}>Plants by type</span>
          <div style={{ height: 180, marginTop: 10 }}>
            <Bar data={typeChartData} options={typeOptions} />
          </div>
        </div>

        {/* Upcoming tasks line chart — replaces health status doughnut */}
        <div style={s.miniCard}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>Upcoming tasks — 14 days</span>
            {totalUpcoming > 0 && (
              <span style={{ ...s.badge, background: C.amber.light, color: '#92400E' }}>{totalUpcoming} scheduled</span>
            )}
          </div>
          {totalUpcoming === 0
            ? <div style={s.empty}>No tasks scheduled</div>
            : <div style={{ height: 160 }}>
                <Line data={upcomingChartData} options={upcomingOptions} />
              </div>
          }
          {/* Care type pills inside the card */}
          {Object.keys(taskTypeCounts).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {Object.entries(taskTypeCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} style={s.typePill}>
                    <span>{TASK_TYPE_ICONS[type] || '📋'}</span>
                    <span style={{ color: C.gray.dark, fontSize: 11 }}>
                      {type.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                    </span>
                    <span style={s.pillBadge}>{count}</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>

      </div>

      {/* TIP */}
      <div style={s.tip}>
        <span style={{ color: C.green.dark, fontWeight: 500 }}>Tip: </span>{tip}
      </div>

    </div>
  );
};

const s = {
  card:         { background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 24px', gridColumn: 'span 8' },
  cardHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle:    { fontSize: 16, fontWeight: 600, color: '#111827', display: 'block' },
  cardSub:      { fontSize: 12, color: '#6B7280', display: 'block', marginTop: 2 },
  refreshBtn:   { background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 10px', fontSize: 16, cursor: 'pointer', color: '#6B7280', lineHeight: 1 },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 },
  statCard:     { background: '#F9FAFB', borderRadius: 8, padding: 14, textAlign: 'center' },
  statVal:      { fontSize: 26, fontWeight: 700, marginBottom: 4 },
  statLabel:    { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  statSub:      { fontSize: 11, color: '#9CA3AF' },
  section:      { background: '#F9FAFB', borderRadius: 8, padding: '14px 16px', marginBottom: 16 },
  sectionHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' },
  badge:        { fontSize: 11, borderRadius: 20, padding: '2px 8px', fontWeight: 500 },
  bottomRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  miniCard:     { background: '#F9FAFB', borderRadius: 8, padding: '14px 16px' },
  tip:          { borderLeft: '3px solid #1D9E75', paddingLeft: 12, fontSize: 13, color: '#6B7280', lineHeight: 1.6 },
  empty:        { textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' },
  typePill:     { display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '3px 9px', fontSize: 12 },
  pillBadge:    { background: '#F3F4F6', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 600, color: '#374151' },
  loadingWrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 },
  spinner:      { width: 28, height: 28, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#1D9E75', animation: 'spin 0.8s linear infinite' },
};

export default AnalyticsChart;
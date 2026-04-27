import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const toChartData = (groupStats) => {
  if (!groupStats) return [];

  return Object.entries(groupStats).flatMap(([feature, groups]) => (
    Object.entries(groups || {}).map(([groupName, value]) => ({
      name: `${feature}: ${groupName}`,
      score: Math.round(Number(value || 0) * 100),
    }))
  ));
};

export default function FairnessChart({ groupStats }) {
  const chartData = toChartData(groupStats);

  if (chartData.length === 0) {
    return (
      <section className="card dashboard-card wide empty-state">
        <div className="empty-state-inner">
          <h3>No group breakdown available</h3>
          <p>Run a scan with protected attributes to populate group-level fairness metrics.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card dashboard-card wide">
      <div className="section-heading">
        <div>
          <h3>Group fairness breakdown</h3>
          <p>Comparison of favorable outcome rates by group.</p>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="var(--text-muted)"
              angle={-35}
              textAnchor="end"
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              stroke="var(--text-muted)"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(183, 255, 90, 0.08)' }}
              formatter={(value) => [`${value}%`, 'Favorable outcome rate']}
              contentStyle={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--text-primary)',
              }}
            />
            <Bar dataKey="score" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

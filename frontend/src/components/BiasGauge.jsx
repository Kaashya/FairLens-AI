const clampScore = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

export default function BiasGauge({ score }) {
  const normalizedScore = clampScore(score);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let color = 'var(--accent-green)';
  let label = 'Low bias';

  if (normalizedScore > 40) {
    color = 'var(--accent-amber)';
    label = 'Moderate bias';
  }

  if (normalizedScore > 70) {
    color = 'var(--accent-red)';
    label = 'High bias';
  }

  return (
    <section className="card dashboard-card gauge-card" style={{ '--gauge-color': color }}>
      <div className="section-heading">
        <div>
          <h3>Overall bias score</h3>
          <p>Higher scores indicate stronger disparities.</p>
        </div>
      </div>

      <div className="gauge-wrap" aria-label={`Bias score ${normalizedScore} out of 100`}>
        <svg width="176" height="176" viewBox="0 0 176 176" role="img">
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="var(--bg-muted)"
            strokeWidth="14"
          />
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 88 88)"
          />
        </svg>
        <div className="gauge-value">
          <strong>{normalizedScore}</strong>
          <span>out of 100</span>
        </div>
      </div>

      <div className="gauge-legend">
        <span className="gauge-dot" />
        {label}
      </div>
    </section>
  );
}

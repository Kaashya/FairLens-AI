import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Download,
  FileUp,
  Gauge,
  ShieldAlert,
} from 'lucide-react';
import BiasGauge from '../components/BiasGauge';
import FairnessChart from '../components/FairnessChart';

const getBiasTone = (score) => {
  if (score > 70) return 'red';
  if (score > 40) return 'amber';
  return 'green';
};

const formatMetric = (value, fallback = 'N/A') => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return parsed.toFixed(Math.abs(parsed) < 10 ? 3 : 1);
};

export default function DashboardPage() {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <main className="page-container">
        <section className="card empty-state">
          <div className="empty-state-inner">
            <div className="empty-icon">
              <FileUp size={28} />
            </div>
            <h2>No analysis data</h2>
            <p>Upload and scan a dataset to view fairness metrics, flagged attributes, and AI insight.</p>
            <Link className="button" to="/upload">
              Upload dataset
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const score = Number(result.bias_score || 0);
  const flaggedColumns = Array.isArray(result.flagged_columns) ? result.flagged_columns : [];
  const metrics = result.metrics || {};
  const verdict = result.verdict || 'Analysis complete';

  const handleDownload = () => {
    const report = {
      generated_at: new Date().toISOString(),
      ...result,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'fairlens-report.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <div className="page-kicker">
            <Gauge size={16} />
            Analysis results
          </div>
          <h1 className="page-title">Fairness Analysis Results</h1>
          <p className="page-description">
            Review bias severity, protected-attribute flags, and group-level outcome differences.
          </p>
        </div>
        <div className="history-tools">
          <span className={`badge ${getBiasTone(score)}`}>
            {verdict}
          </span>
          <button className="btn-secondary" type="button" onClick={handleDownload}>
            <Download size={18} />
            Download report
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <BiasGauge score={score} />

        <section className="card dashboard-card">
          <div className="section-heading">
            <div>
              <h3>Key metrics</h3>
              <p>Core signals from the latest scan.</p>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric-tile">
              <span>Demographic parity diff</span>
              <strong>{formatMetric(metrics.demographic_parity_diff)}</strong>
            </div>
            <div className="metric-tile">
              <span>Disparate impact</span>
              <strong>{formatMetric(metrics.disparate_impact)}</strong>
            </div>
            <div className="metric-tile">
              <span>Flagged columns</span>
              <strong>{flaggedColumns.length}</strong>
            </div>
            <div className="metric-tile">
              <span>Bias score</span>
              <strong>{score}</strong>
            </div>
          </div>
        </section>

        <section className="card dashboard-card">
          <div className="section-heading">
            <div>
              <h3>Protected attribute flags</h3>
              <p>Columns with measurable disparity signals.</p>
            </div>
          </div>
          {flaggedColumns.length > 0 ? (
            <div className="flag-list">
              {flaggedColumns.map((column) => (
                <span className="flag-chip" key={column}>
                  <AlertTriangle size={15} />
                  {column}
                </span>
              ))}
            </div>
          ) : (
            <div className="readiness-row is-ready">
              <div className="readiness-icon">
                <ShieldAlert size={18} />
              </div>
              <div>
                <strong>No flagged attributes</strong>
                <span>No protected column crossed the current threshold.</span>
              </div>
            </div>
          )}
        </section>

        <FairnessChart groupStats={result.group_stats} />

        <section className="card dashboard-card insight-panel">
          <div className="section-heading">
            <div>
              <h3>AI insight</h3>
              <p>Plain-language summary of the scan.</p>
            </div>
            <Bot size={22} color="var(--primary)" />
          </div>

          <div className="insight-copy">
            {result.ai_explanation || 'No AI explanation was included with this scan.'}
          </div>

          <Link className="button btn-secondary" to="/chat">
            Ask follow-up
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </main>
  );
}

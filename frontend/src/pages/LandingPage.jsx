import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  History,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';

const dayCells = [
  ['01', 'Mon'],
  ['02', 'Tue'],
  ['03', 'Wed'],
  ['04', 'Thu'],
  ['05', 'Fri'],
  ['06', 'Sat'],
  ['07', 'Sun'],
];

const metricBars = [62, 84, 54, 71, 38, 92, 66, 48];

const insightCards = [
  {
    icon: ScanSearch,
    title: 'Detect bias signals',
    copy: 'Measure fairness drift across protected attributes and spot high-risk columns.',
  },
  {
    icon: Bot,
    title: 'Explain the result',
    copy: 'Turn statistical metrics into readable context your team can act on.',
  },
  {
    icon: History,
    title: 'Track every scan',
    copy: 'Keep a record of datasets, verdicts, bias scores, and improvement over time.',
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-kicker">
            <ShieldCheck size={17} />
            AI fairness audit workspace
          </div>
          <h1>See dataset bias before it reaches users.</h1>
          <p>
            FairLens helps you upload a dataset, identify protected-attribute disparities,
            understand fairness metrics, and generate AI-assisted explanations in one workflow.
          </p>

          <div className="landing-actions">
            <Link className="button landing-primary" to="/upload">
              <UploadCloud size={18} />
              Start uploading
            </Link>
            <Link className="button landing-secondary" to="/history">
              View scan history
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="landing-proof">
            <div>
              <strong>CSV first</strong>
              <span>No model retraining required to begin.</span>
            </div>
            <div>
              <strong>Metric aware</strong>
              <span>Bias score, parity gap, and impact ratio.</span>
            </div>
          </div>
        </div>

        <div className="landing-dashboard" aria-label="FairLens overview dashboard preview">
          <div className="landing-dashboard-top">
            <div>
              <span>FairLens audit room</span>
              <h2>Overview dashboard</h2>
            </div>
            <span className="status-pill">
              <CheckCircle2 size={15} />
              Ready
            </span>
          </div>

          <div className="landing-date-row">
            {dayCells.map(([date, day], index) => (
              <div className={`landing-date-cell ${index === 4 ? 'active' : ''}`} key={date}>
                <strong>{date}</strong>
                <span>{day}</span>
              </div>
            ))}
          </div>

          <div className="landing-dashboard-grid">
            <section className="landing-panel score-panel">
              <div className="panel-label">
                <Gauge size={16} />
                Bias monitor
              </div>
              <div className="landing-score-ring">
                <strong>72</strong>
                <span>risk score</span>
              </div>
              <span className="badge red">
                <ShieldAlert size={14} />
                High bias detected
              </span>
            </section>

            <section className="landing-panel mini-chart-panel">
              <div className="panel-label">
                <BarChart3 size={16} />
                Attribute parity
              </div>
              <div className="mini-bars">
                {metricBars.map((height, index) => (
                  <span
                    className={index === 5 ? 'is-alert' : ''}
                    style={{ '--bar-height': `${height}%` }}
                    key={`${height}-${index}`}
                  />
                ))}
              </div>
              <div className="chart-legend">
                <span>Stable</span>
                <strong>1 flagged group</strong>
              </div>
            </section>

            <section className="landing-panel workflow-panel">
              <div className="panel-label">
                <FileSpreadsheet size={16} />
                Audit flow
              </div>
              <div className="workflow-steps">
                <span>Upload CSV</span>
                <span>Select outcome</span>
                <span>Review fairness</span>
              </div>
            </section>

            <section className="landing-panel ai-panel">
              <div className="panel-label">
                <Bot size={16} />
                AI insight
              </div>
              <p>
                The protected attribute gap indicates a meaningful outcome difference.
                Review policy, sampling, and feature leakage before deployment.
              </p>
            </section>
          </div>
        </div>
      </section>

      <section className="landing-insights" aria-label="What FairLens does">
        {insightCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="landing-insight-card" key={card.title}>
              <div className="insight-card-icon">
                <Icon size={22} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

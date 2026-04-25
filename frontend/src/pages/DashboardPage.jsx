import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import BiasGauge from '../components/BiasGauge';
import FairnessChart from '../components/FairnessChart';
import { AlertTriangle, Info, Bot } from 'lucide-react';

export default function DashboardPage() {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h2>No Analysis Data</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please upload and analyze a dataset first.</p>
        <Link to="/">
          <button>Go to Upload</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Fairness Analysis Results</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
            <span className={`badge ${result.bias_score > 70 ? 'red' : result.bias_score > 40 ? 'amber' : 'green'}`}>
              {result.verdict}
            </span>
          </div>
        </div>
        <button style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          Download Report
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Top Left: Bias Gauge */}
        <BiasGauge score={result.bias_score} />

        {/* Top Right: Flagged Attributes & Metrics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Key Metrics & Flags</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Flagged Columns
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {result.flagged_columns.map(col => (
                <div key={col} style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  backgroundColor: 'rgba(229, 57, 53, 0.1)', color: 'var(--accent-red)',
                  padding: '0.5rem 1rem', borderRadius: 'var(--border-radius)', fontWeight: 500
                }}>
                  <AlertTriangle size={16} />
                  {col}
                </div>
              ))}
              {result.flagged_columns.length === 0 && (
                <span style={{ color: 'var(--text-secondary)' }}>None flagged</span>
              )}
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Statistical Metrics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Demographic Parity Diff</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result.metrics.demographic_parity_diff}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Disparate Impact</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result.metrics.disparate_impact}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Fairness Chart */}
        <FairnessChart groupStats={result.group_stats} />

        {/* Bottom Right: AI Explanation */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(255, 152, 0, 0.3)', background: 'linear-gradient(to bottom right, var(--bg-surface), rgba(255, 152, 0, 0.05))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'var(--primary-amber)', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#000" />
            </div>
            <h3 style={{ margin: 0 }}>AI Insight</h3>
          </div>
          
          <div style={{ 
            flex: 1, backgroundColor: 'var(--bg-dark)', padding: '1.5rem', 
            borderRadius: 'var(--border-radius)', color: 'var(--text-primary)',
            lineHeight: 1.6
          }}>
            {result.ai_explanation}
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/chat">
              <button style={{ backgroundColor: 'transparent', color: 'var(--primary-amber)', border: '1px solid var(--primary-amber)' }}>
                Ask AI for Details →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

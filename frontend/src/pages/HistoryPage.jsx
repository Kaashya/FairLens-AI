import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { fetchHistory } from '../api';

const getBiasTone = (score) => {
  if (score > 70) return 'red';
  if (score > 40) return 'amber';
  return 'green';
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('History could not be loaded. Check the backend connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadHistory();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return history;

    return history.filter((item) => {
      const flags = Array.isArray(item.flagged_columns) ? item.flagged_columns.join(' ') : '';
      return `${item.dataset_name || ''} ${item.verdict || ''} ${flags}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [history, query]);

  const summary = useMemo(() => {
    const total = history.length;
    const average = total
      ? Math.round(history.reduce((sum, item) => sum + Number(item.bias_score || 0), 0) / total)
      : 0;
    const highRisk = history.filter((item) => Number(item.bias_score || 0) > 70).length;

    return { total, average, highRisk };
  }, [history]);

  const openScan = (item) => {
    navigate('/dashboard', {
      state: {
        result: {
          ...item,
          flagged_columns: Array.isArray(item.flagged_columns) ? item.flagged_columns : [],
          metrics: item.metrics || {},
          group_stats: item.group_stats || {},
          ai_explanation: item.ai_explanation || 'This saved scan contains the stored report summary and metrics.',
        },
      },
    });
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <div className="page-kicker">
            <Clock3 size={16} />
            Audit trail
          </div>
          <h1 className="page-title">Scan History</h1>
          <p className="page-description">
            Track fairness audits over time and revisit previous scan summaries.
          </p>
        </div>
        <div className="history-tools">
          <div className="search-box">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search scans"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button className="btn-secondary" type="button" onClick={loadHistory} disabled={isLoading}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      <div className="history-summary">
        <section className="card summary-card">
          <div className="summary-icon">
            <FileText size={21} />
          </div>
          <div>
            <span>Total scans</span>
            <strong>{summary.total}</strong>
          </div>
        </section>
        <section className="card summary-card">
          <div className="summary-icon">
            <ShieldCheck size={21} />
          </div>
          <div>
            <span>Average score</span>
            <strong>{summary.average}</strong>
          </div>
        </section>
        <section className="card summary-card">
          <div className="summary-icon">
            <AlertTriangle size={21} />
          </div>
          <div>
            <span>High risk scans</span>
            <strong>{summary.highRisk}</strong>
          </div>
        </section>
      </div>

      <section className="card table-card">
        {isLoading ? (
          <div className="empty-state">
            <div className="empty-state-inner">
              <span className="spinner" />
              <h3 className="loading-title">Loading history</h3>
            </div>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-inner">
              <div className="empty-icon">
                <AlertTriangle size={26} />
              </div>
              <h3>Could not load history</h3>
              <p>{error}</p>
              <button type="button" onClick={loadHistory}>
                Retry
              </button>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-inner">
              <div className="empty-icon">
                <FileText size={26} />
              </div>
              <h3>No scans found</h3>
              <p>{query ? 'No saved scan matches your search.' : 'Completed audits will appear here.'}</p>
            </div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Date</th>
                  <th>Bias score</th>
                  <th>Flags</th>
                  <th>Verdict</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const flags = Array.isArray(item.flagged_columns) ? item.flagged_columns : [];
                  const score = Number(item.bias_score || 0);

                  return (
                    <tr key={item.id || `${item.dataset_name}-${item.timestamp}`}>
                      <td>
                        <div className="dataset-cell">
                          <span className="dataset-icon">
                            <FileText size={17} />
                          </span>
                          {item.dataset_name || 'Untitled dataset'}
                        </div>
                      </td>
                      <td className="muted-cell">{formatDate(item.timestamp)}</td>
                      <td>
                        <span className={`badge ${getBiasTone(score)}`}>
                          {score}
                        </span>
                      </td>
                      <td className="muted-cell">{flags.length ? flags.join(', ') : 'None'}</td>
                      <td>
                        <span className={`badge ${getBiasTone(score)}`}>
                          {item.verdict || 'Complete'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary" type="button" onClick={() => openScan(item)}>
                          Review
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

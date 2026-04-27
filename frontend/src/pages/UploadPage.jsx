import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  PlayCircle,
  ShieldCheck,
  Target,
  UploadCloud,
  X,
} from 'lucide-react';
import { analyzeDataset } from '../api';

const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / (1024 ** index);
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [targetCol, setTargetCol] = useState('');
  const [protectedCols, setProtectedCols] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const resetFile = () => {
    setFile(null);
    setColumns([]);
    setTargetCol('');
    setProtectedCols([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a CSV file.');
      return;
    }

    setError('');
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      preview: 1,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta?.fields?.filter(Boolean) || [];
        setColumns(fields);
        setTargetCol(fields.at(-1) || '');
        setProtectedCols([]);
        if (fields.length === 0) {
          setError('No column headers were found in this CSV.');
        }
      },
      error: () => {
        resetFile();
        setError('FairLens could not read this CSV. Please check the file and try again.');
      },
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const toggleProtectedColumn = (column) => {
    setProtectedCols((current) => (
      current.includes(column)
        ? current.filter((item) => item !== column)
        : [...current, column]
    ));
  };

  const handleAnalyze = async () => {
    if (!file || !targetCol) return;
    setIsAnalyzing(true);
    setError('');

    try {
      const result = await analyzeDataset(file, targetCol, protectedCols);
      navigate('/dashboard', { state: { result } });
    } catch (err) {
      console.error(err);
      setError('The analysis failed. Please make sure the backend is running and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readiness = [
    {
      label: 'CSV file',
      value: file ? file.name : 'Waiting for upload',
      ready: Boolean(file),
      icon: FileSpreadsheet,
    },
    {
      label: 'Target column',
      value: targetCol || 'Select an outcome',
      ready: Boolean(targetCol),
      icon: Target,
    },
    {
      label: 'Protected attributes',
      value: protectedCols.length ? `${protectedCols.length} selected` : 'Optional',
      ready: protectedCols.length > 0,
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <div className="page-kicker">
            <ShieldCheck size={16} />
            Bias scanner
          </div>
          <h1 className="page-title">Dataset Bias Scanner</h1>
          <p className="page-description">
            Upload a CSV, select the outcome column, and run a focused fairness audit across protected attributes.
          </p>
        </div>
      </div>

      <div className="upload-layout">
        <section className="tool-panel upload-panel">
          <div className="section-heading">
            <div>
              <h3>Dataset</h3>
              <p>CSV files with a header row work best.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => handleFileSelect(event.target.files?.[0])}
          />

          <div
            className={`dropzone ${isDragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="file-card">
                <div className="file-icon">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="file-details">
                  <strong>{file.name}</strong>
                  <span>{formatFileSize(file.size)} - {columns.length} columns detected</span>
                </div>
                <button
                  className="btn-danger btn-icon"
                  type="button"
                  aria-label="Remove selected file"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetFile();
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  <UploadCloud size={30} />
                </div>
                <strong>Drop a CSV here or browse files</strong>
                <span>FairLens will read the header row before analysis.</span>
              </div>
            )}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="setup-grid">
            <div className="field-group">
              <label htmlFor="target-column">Target column</label>
              <select
                id="target-column"
                value={targetCol}
                disabled={columns.length === 0}
                onChange={(event) => {
                  setTargetCol(event.target.value);
                  setProtectedCols((current) => current.filter((column) => column !== event.target.value));
                }}
              >
                {columns.length === 0 ? (
                  <option>Upload a dataset first</option>
                ) : (
                  columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))
                )}
              </select>
              <span className="field-hint">
                <Target size={14} />
                The outcome FairLens should evaluate.
              </span>
            </div>

            <div className="field-group">
              <label>Protected attributes</label>
              <div className="checkbox-grid">
                {columns.length === 0 ? (
                  <span className="muted-cell">Upload a dataset to select attributes.</span>
                ) : (
                  columns
                    .filter((column) => column !== targetCol)
                    .map((column) => (
                      <label
                        className={`checkbox-pill ${protectedCols.includes(column) ? 'is-selected' : ''}`}
                        key={column}
                      >
                        <input
                          type="checkbox"
                          checked={protectedCols.includes(column)}
                          onChange={() => toggleProtectedColumn(column)}
                        />
                        {column}
                      </label>
                    ))
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="tool-panel audit-panel">
          <div className="section-heading">
            <div>
              <h3>Audit setup</h3>
              <p>Ready status updates as your dataset is configured.</p>
            </div>
          </div>

          <div className="readiness-list">
            {readiness.map((item) => {
              const Icon = item.icon;
              return (
                <div className={`readiness-row ${item.ready ? 'is-ready' : ''}`} key={item.label}>
                  <div className="readiness-icon">
                    {item.ready ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="btn-wide audit-submit"
            type="button"
            disabled={!file || !targetCol || isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner" />
                Analyzing
              </>
            ) : (
              <>
                <PlayCircle size={19} />
                Run fairness audit
              </>
            )}
          </button>
        </aside>
      </div>
    </main>
  );
}

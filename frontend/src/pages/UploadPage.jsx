import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, AlertCircle } from 'lucide-react';
import { analyzeDataset } from '../api';
import Papa from 'papaparse';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [targetCol, setTargetCol] = useState('');
  const [protectedCols, setProtectedCols] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        preview: 1, // Only read the first few rows to get headers
        complete: (results) => {
          if (results.meta && results.meta.fields) {
            setColumns(results.meta.fields);
            if (results.meta.fields.length > 0) {
              // Default to the last column for target
              setTargetCol(results.meta.fields[results.meta.fields.length - 1]);
            }
            setProtectedCols([]);
          }
        }
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeDataset(file, targetCol, protectedCols);
      // Pass the result to the dashboard page via router state
      navigate('/dashboard', { state: { result } });
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="page-container animated-bg-container">
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
          Dataset Bias Scanner
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', textAlign: 'center', maxWidth: '600px', fontSize: '1.1rem' }}>
          Upload your dataset to automatically detect bias, compute fairness metrics, and generate AI-driven explanations.
        </p>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
          <div 
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary-amber)'; e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.05)'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = file ? 'var(--primary-amber)' : 'var(--border-color)'; e.currentTarget.style.backgroundColor = file ? 'rgba(255, 152, 0, 0.05)' : 'transparent'; }}
            onDrop={(e) => {
              handleDrop(e);
              e.currentTarget.style.borderColor = 'var(--primary-amber)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.05)';
            }}
            style={{
              border: '2px dashed',
              borderColor: file ? 'var(--primary-amber)' : 'var(--border-color)',
              borderRadius: 'var(--border-radius)',
              padding: '3rem 2rem',
              textAlign: 'center',
              marginBottom: '2rem',
              backgroundColor: file ? 'rgba(255, 152, 0, 0.05)' : 'transparent',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <File size={48} color="var(--primary-amber)" style={{ animation: 'float 3s ease-in-out infinite' }} />
                <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{file.name}</div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); setColumns([]); setTargetCol(''); setProtectedCols([]); }} 
                  style={{ background: 'transparent', color: 'var(--accent-red)', padding: '0.4rem 1rem', border: '1px solid var(--accent-red)', borderRadius: '20px' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                <UploadCloud size={56} style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }} />
                <div style={{ fontSize: '1.1rem' }}>
                  <strong>Drag and drop</strong> your CSV file here, or{' '}
                  <label style={{ color: 'var(--primary-amber)', cursor: 'pointer', textDecoration: 'underline' }}>
                    browse
                    <input 
                      type="file" 
                      accept=".csv" 
                      style={{ display: 'none' }} 
                      onChange={(e) => handleFileSelect(e.target.files[0])} 
                    />
                  </label>
                </div>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Supports .csv files up to 50MB</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Target Column (Outcome)</label>
              {columns.length > 0 ? (
                <select 
                  value={targetCol} 
                  onChange={(e) => setTargetCol(e.target.value)}
                  style={{ padding: '0.8rem 1rem', fontSize: '1rem', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                >
                  {columns.map(col => (
                    <option key={col} value={col} style={{ background: '#333' }}>{col}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={targetCol} 
                  onChange={(e) => setTargetCol(e.target.value)} 
                  placeholder="e.g., loan_approved"
                  disabled={true}
                  style={{ padding: '0.8rem 1rem', fontSize: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', opacity: 0.5 }}
                />
              )}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> The column predicting the outcome.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Protected Attributes</label>
              {columns.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  {columns.filter(c => c !== targetCol).map(col => (
                    <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <input 
                        type="checkbox" 
                        checked={protectedCols.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProtectedCols([...protectedCols, col]);
                          } else {
                            setProtectedCols(protectedCols.filter(c => c !== col));
                          }
                        }}
                      />
                      {col}
                    </label>
                  ))}
                </div>
              ) : (
                <input 
                  type="text" 
                  value="" 
                  onChange={() => {}} 
                  placeholder="Upload a dataset first"
                  disabled={true}
                  style={{ padding: '0.8rem 1rem', fontSize: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', opacity: 0.5 }}
                />
              )}
            </div>
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={!file || isAnalyzing}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.75rem',
              borderRadius: '12px',
              animation: (!file || isAnalyzing) ? 'none' : 'pulse-glow 2s infinite'
            }}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                Analyzing Dataset...
              </>
            ) : (
              <>Analyze Dataset</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

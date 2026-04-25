import React from 'react';

export default function BiasGauge({ score }) {
  // Score is 0-100. Lower is better (less bias) or higher is better (more fair)? 
  // Let's assume higher score = more biased (based on "High Bias Detected: 72")
  
  let color = 'var(--accent-green)'; // Low bias
  let label = 'Low Bias';
  
  if (score > 40) {
    color = 'var(--primary-amber)'; // Medium bias
    label = 'Moderate Bias';
  }
  if (score > 70) {
    color = 'var(--accent-red)'; // High bias
    label = 'High Bias';
  }

  // Circular progress math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Overall Bias Score</h3>
      
      <div style={{ position: 'relative', width: '150px', height: '150px' }}>
        {/* Background Circle */}
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle
            cx="75" cy="75" r={radius}
            fill="none" stroke="var(--bg-elevated)" strokeWidth="12"
          />
          {/* Progress Circle */}
          <circle
            cx="75" cy="75" r={radius}
            fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
            transform="rotate(-90 75 75)"
          />
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {score}
          </span>
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }}></div>
        <span style={{ fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}

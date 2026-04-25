import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FairnessChart({ groupStats }) {
  // Transform group_stats object into array for Recharts
  // Input: { gender: { Male: 0.82, Female: 0.48 }, age: { "<30": 0.71, ... } }
  
  if (!groupStats) return <div className="card">No fairness data available.</div>;

  const chartData = [];
  
  Object.keys(groupStats).forEach(feature => {
    const featureGroups = groupStats[feature];
    Object.keys(featureGroups).forEach(groupName => {
      chartData.push({
        name: `${feature}: ${groupName}`,
        FairnessScore: featureGroups[groupName] * 100 // converting to percentage for better visualization
      });
    });
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Group Fairness Breakdown</h3>
      
      <div style={{ flex: 1, minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-secondary)" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 12 }} 
              interval={0}
            />
            <YAxis stroke="var(--text-secondary)" domain={[0, 100]} />
            <Tooltip 
              cursor={{ fill: 'var(--bg-elevated)' }}
              contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <Bar dataKey="FairnessScore" fill="var(--primary-amber)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

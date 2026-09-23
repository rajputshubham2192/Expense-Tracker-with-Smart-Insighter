import React, { useState } from 'react';
import { Calendar, Flame } from 'lucide-react';

export const SpendingHeatmap = ({ heatmapData = [] }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 1:
        return '#0e3a5a'; // Low spend (dark cyan/blue)
      case 2:
        return '#0284c7'; // Medium spend (sky blue)
      case 3:
        return '#6366f1'; // High spend (indigo)
      case 4:
        return '#f43f5e'; // Peak / Anomaly Spike (rose)
      default:
        return 'rgba(255, 255, 255, 0.05)'; // Zero spend
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Calendar size={18} color="#06b6d4" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
            Daily Spending Heatmap (Last 60 Days)
          </h3>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: getIntensityColor(level),
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
          ))}
          <span>Peak</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))',
        gap: '6px',
        padding: '0.5rem 0'
      }}>
        {heatmapData.map((item, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredDay(item)}
            onMouseLeave={() => setHoveredDay(null)}
            style={{
              height: '24px',
              borderRadius: '4px',
              background: getIntensityColor(item.intensity),
              border: hoveredDay?.date === item.date ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s',
              transform: hoveredDay?.date === item.date ? 'scale(1.25)' : 'scale(1)',
              zIndex: hoveredDay?.date === item.date ? 10 : 1
            }}
          />
        ))}
      </div>

      {/* Hover Tooltip Output */}
      <div style={{
        minHeight: '26px',
        marginTop: '0.75rem',
        fontSize: '0.8rem',
        color: hoveredDay ? '#f8fafc' : 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {hoveredDay ? (
          <>
            <span style={{ color: '#06b6d4', fontWeight: 600 }}>📅 {hoveredDay.date}:</span>
            <span>₹{hoveredDay.amount.toLocaleString('en-IN')} across {hoveredDay.transaction_count} transaction{hoveredDay.transaction_count === 1 ? '' : 's'}</span>
            {hoveredDay.intensity === 4 && (
              <span className="badge badge-anomaly" style={{ marginLeft: 'auto' }}>
                <Flame size={12} /> High Outlier Day
              </span>
            )}
          </>
        ) : (
          <span>Hover over any day square to see exact expenditure and transaction activity.</span>
        )}
      </div>
    </div>
  );
};

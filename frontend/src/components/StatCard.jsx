import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, color = '#6366f1', trend }) => {
  return (
    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: color
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: `${color}18`,
          border: `1px solid ${color}35`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {Icon && <Icon size={18} />}
        </div>
      </div>

      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{subtext}</span>
        {trend && (
          <span style={{
            color: trend.isPositive ? '#10b981' : '#f43f5e',
            fontWeight: 600
          }}>
            {trend.isPositive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>
    </div>
  );
};

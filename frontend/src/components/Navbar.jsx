import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Sparkles, Bell } from 'lucide-react';

export const Navbar = ({ activePage }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 2rem',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(10, 13, 20, 0.75)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {activePage}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          AI Financial Intelligence & Analytics System
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.8rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          color: '#a5b4fc'
        }}>
          <Sparkles size={14} />
          <span>ML Engine: <strong>Active</strong></span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#fff'
              }}>
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user.email}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Logout"
            >
              <LogOut size={15} />
              <span>Exit</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

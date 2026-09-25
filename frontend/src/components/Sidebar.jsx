import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Sparkles, 
  Tags, 
  TrendingUp,
  Users
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Budgets & Targets', icon: PieChart },
    { id: 'ai-insights', label: 'AI Smart Insighter', icon: Sparkles, highlight: true },
    { id: 'categories', label: 'Categories', icon: Tags },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Portal', icon: Users, adminOnly: true });
  }


  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      background: 'rgba(12, 16, 26, 0.95)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 200
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.75rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
        }}>
          <TrendingUp size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.01em', color: '#fff', textTransform: 'uppercase', lineHeight: '1.25' }}>
            Expense Tracker with Smart Insighter
          </h1>
        </div>
      </div>



      {/* Navigation Links */}
      <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive 
                  ? (item.highlight ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.2))' : 'rgba(255, 255, 255, 0.08)')
                  : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: isActive ? (item.highlight ? '3px solid #06b6d4' : '3px solid var(--accent-primary)') : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} color={isActive ? (item.highlight ? '#38bdf8' : '#818cf8') : 'currentColor'} />
              <span>{item.label}</span>
              {item.highlight && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#38bdf8',
                  fontWeight: 700
                }}>
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};


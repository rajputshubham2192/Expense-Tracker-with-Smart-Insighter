import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Categories } from './pages/Categories';
import { AIInsights } from './pages/AIInsights';
import { AdminDashboard } from './pages/AdminDashboard';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0d14',
        color: '#6366f1'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '45px',
            height: '45px',
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Initializing Smart Insighter...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'transactions':
        return <Transactions />;
      case 'budgets':
        return <Budgets />;
      case 'ai-insights':
        return <AIInsights />;
      case 'categories':
        return <Categories />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Financial Overview & Projections';
      case 'transactions':
        return 'Transaction Ledger & Categorization';
      case 'budgets':
        return 'Budget Tracking & Alert Thresholds';
      case 'ai-insights':
        return 'Smart Insighter™ AI Diagnostics';
      case 'categories':
        return 'Category Architecture';
      case 'admin':
        return 'Administrator Oversight Portal';
      default:
        return 'Dashboard';
    }
  };


  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar activePage={getPageTitle()} />
        <main style={{ flex: 1 }}>
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

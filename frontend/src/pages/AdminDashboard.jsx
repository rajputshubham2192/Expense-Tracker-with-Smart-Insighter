import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Users, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Flame, 
  Eye, 
  X, 
  UserCheck, 
  UserX, 
  Sparkles,
  PieChart,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

export const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleInspectUser = async (userId) => {
    try {
      setInspectLoading(true);
      const userDetail = await api.getAdminUserAnalytics(userId);
      setSelectedUserDetail(userDetail);
    } catch (err) {
      alert('Failed to fetch user analytics.');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      fetchAdminData();
      if (selectedUserDetail && selectedUserDetail.user_id === userId) {
        setSelectedUserDetail(prev => ({ ...prev, is_active: !prev.is_active }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${userName}"?\n\nThis will remove their profile and all associated transactions, budgets, and records.`)) {
      try {
        await api.deleteUser(userId);
        fetchAdminData();
        if (selectedUserDetail && selectedUserDetail.user_id === userId) {
          setSelectedUserDetail(null);
        }
      } catch (err) {
        alert(err.message || 'Failed to delete user.');
      }
    }
  };


  if (loading || !overview) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Admin Portal & Platform Analytics...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const filteredUsers = overview.recent_registrations.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
          <ShieldCheck size={24} color="#6366f1" />
          <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>
            Administrator Oversight Portal
          </h1>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          System-wide directory of all registered users, cumulative spending telemetry, and category expenditure breakdown.
        </p>
      </div>

      {/* Global Platform KPIs */}
      <div className="grid-4">
        <StatCard
          title="Registered Users"
          value={overview.total_registered_users}
          subtext={`${overview.active_users_count} Active Accounts`}
          icon={Users}
          color="#6366f1"
        />
        <StatCard
          title="Platform Gross Volume"
          value={`₹${overview.total_platform_volume.toLocaleString('en-IN')}`}
          subtext="Total Cash Inflow + Outflow"
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          title="Total User Expenses"
          value={`₹${overview.total_platform_expenses.toLocaleString('en-IN')}`}
          subtext="Cumulative Spend Tracked"
          icon={TrendingDown}
          color="#f43f5e"
        />
        <StatCard
          title="Flagged Anomalies"
          value={overview.total_anomalies_detected}
          subtext="Isolation Forest Outliers"
          icon={Flame}
          color="#f59e0b"
          trend={{ isPositive: false, text: 'Under Monitor' }}
        />
      </div>

      {/* Top Spending Categories Platform-Wide */}
      <div className="glass-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Platform-Wide Top Spending Categories</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aggregated across all registered users</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {overview.top_categories_platform_wide.map((cat, idx) => (
            <div
              key={idx}
              style={{
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                <strong style={{ fontSize: '0.875rem', color: '#fff' }}>{cat.name}</strong>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{cat.total_spend.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {cat.transaction_count} transactions logged
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registered Users & Spending Habits Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>All Registered Users & Spending Habits</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Inspect user balances, total outlays, and primary expenditure sectors (where they spend more money).
            </p>
          </div>

          <input
            type="text"
            className="input-control"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '280px', padding: '0.5rem 0.85rem' }}
          />
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Total Income</th>
                <th>Total Expense</th>
                <th>Net Balance</th>
                <th>Top Spending Area</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-ai' : 'badge-income'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: '#34d399', fontWeight: 600 }}>
                    ₹{u.total_income.toLocaleString('en-IN')}
                  </td>
                  <td style={{ color: '#f43f5e', fontWeight: 600 }}>
                    ₹{u.total_expense.toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontWeight: 700, color: u.net_balance >= 0 ? '#38bdf8' : '#fb7185' }}>
                    ₹{u.net_balance.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                      🔥 {u.top_spending_category}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: u.is_active ? '#10b981' : '#f43f5e'
                    }}>
                      {u.is_active ? '● Active' : '● Disabled'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleInspectUser(u.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.65rem' }}
                        title="View Detailed Category Breakdown & Transactions"
                      >
                        <Eye size={14} color="#38bdf8" />
                        <span>Inspect</span>
                      </button>

                      {u.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-secondary'}`}
                            style={{ padding: '0.35rem 0.5rem' }}
                            title={u.is_active ? 'Disable Account' : 'Enable Account'}
                          >
                            {u.is_active ? <UserX size={14} color="#f59e0b" /> : <UserCheck size={14} color="#10b981" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="Permanently Delete User"
                          >
                            <Trash2 size={14} color="#f43f5e" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Inspection Modal */}
      {selectedUserDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
                  User Spending Intelligence: {selectedUserDetail.full_name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedUserDetail.email} — Financial Audit
                </p>
              </div>
              <button onClick={() => setSelectedUserDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* User Financial Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Inflow</div>
                <strong style={{ color: '#34d399', fontSize: '1.1rem' }}>₹{selectedUserDetail.total_income.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Outflow</div>
                <strong style={{ color: '#f43f5e', fontSize: '1.1rem' }}>₹{selectedUserDetail.total_expense.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Net Balance</div>
                <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>₹{selectedUserDetail.current_balance.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Where they spend more money: Category Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>
                📊 Category Spending Distribution (Where They Spend More)
              </h4>

              {selectedUserDetail.category_breakdown.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No expense data recorded for this user yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedUserDetail.category_breakdown.map((c) => (
                    <div key={c.category_id || c.category_name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#fff', fontWeight: 500 }}>{c.category_name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                          ₹{c.total_amount.toLocaleString('en-IN')} ({c.percentage}%)
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.percentage}%`, background: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions Feed */}
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>
                Recent Transactions Log
              </h4>
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserDetail.recent_transactions.slice(0, 7).map((t) => (
                      <tr key={t.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{t.date}</td>
                        <td style={{ color: '#fff', fontWeight: 500 }}>{t.description}</td>
                        <td>
                          <span style={{ color: t.category_color, fontSize: '0.75rem' }}>{t.category_name}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f8fafc' }}>
                          {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedUserDetail(null)} className="btn btn-primary btn-sm">
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

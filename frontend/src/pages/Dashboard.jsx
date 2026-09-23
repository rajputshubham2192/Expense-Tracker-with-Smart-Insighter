import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { SpendingHeatmap } from '../components/SpendingHeatmap';
import { TransactionModal } from '../components/TransactionModal';
import { ImportCsvModal } from '../components/ImportCsvModal';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  AlertTriangle, 
  Sparkles, 
  PlusCircle, 
  UploadCloud, 
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Flame,
  CheckCircle
} from 'lucide-react';

export const Dashboard = ({ setActiveTab }) => {
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewData, forecastData, catsData] = await Promise.all([
        api.getDashboardOverview(),
        api.getForecast(),
        api.getCategories()
      ]);
      setOverview(overviewData);
      setForecast(forecastData);
      setCategories(catsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTransaction = async (data) => {
    await api.createTransaction(data);
    fetchData();
  };

  if (loading || !overview) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Aggregating AI financial metrics & spending telemetry...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Banner Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.2rem' }}>
            Financial Overview & Projections
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time financial telemetry powered by NLP categorization and trend regression.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="btn btn-secondary"
          >
            <UploadCloud size={16} color="#38bdf8" />
            <span>Import Statement (CSV)</span>
          </button>
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Proactive Predictive Alert Banner */}
      {forecast && (forecast.overspend_risk_level === 'CRITICAL' || overview.active_anomalies_count > 0) && (
        <div style={{
          background: forecast.overspend_risk_level === 'CRITICAL' 
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(239, 68, 68, 0.25))' 
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 179, 8, 0.2))',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.2rem' }}>
                {forecast.overspend_risk_level === 'CRITICAL' 
                  ? '⚠️ High Risk: Month-End Spend Projected to Exceed Target!' 
                  : '🔍 Spending Anomaly Alerts Detected'}
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                At your current daily burn rate of <strong>₹{forecast.daily_average_burn_rate?.toLocaleString('en-IN')}/day</strong>, projected month-end expense is <strong>₹{forecast.forecasted_month_end_expense?.toLocaleString('en-IN')}</strong>.

                {overview.active_anomalies_count > 0 && ` (${overview.active_anomalies_count} outlier transactions flagged).`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ai-insights')}
            className="btn btn-secondary btn-sm"
            style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>Open AI Diagnostics</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid-4">
        <StatCard
          title="Current Net Balance"
          value={`₹${overview.current_balance.toLocaleString('en-IN')}`}
          subtext="Available Liquid Reserves"
          icon={Wallet}
          color="#6366f1"
        />
        <StatCard
          title="Total Inflow (Income)"
          value={`₹${overview.total_income.toLocaleString('en-IN')}`}
          subtext={`Current Month: ₹${overview.month_income.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="#10b981"
          trend={{ isPositive: true, text: 'Active' }}
        />
        <StatCard
          title="Total Outflow (Expenses)"
          value={`₹${overview.total_expenses.toLocaleString('en-IN')}`}
          subtext={`Current Month: ₹${overview.month_expense.toLocaleString('en-IN')}`}
          icon={TrendingDown}
          color="#f43f5e"
          trend={{ isPositive: false, text: `${overview.categories_breakdown.length} Categories` }}
        />
        <StatCard
          title="Savings Margin"
          value={`${overview.savings_rate}%`}
          subtext="Income Retained Ratio"
          icon={PiggyBank}
          color="#06b6d4"
          trend={{ isPositive: overview.savings_rate >= 20, text: 'Target: >20%' }}
        />
      </div>

      {/* Forecast & Cashflow Two-Column Matrix */}
      <div className="grid-2">
        {/* Forecast Card */}
        {forecast && (
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={18} color="#a855f7" />
                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Predictive Month-End Burn Rate</h3>
              </div>
              <span className={`badge ${forecast.overspend_risk_level === 'CRITICAL' ? 'badge-anomaly' : 'badge-ai'}`}>
                Risk: {forecast.overspend_risk_level}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Month-To-Date</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
                  ₹{forecast.current_month_spent.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {forecast.days_elapsed} days elapsed
                </div>
              </div>

              <div style={{ background: 'rgba(99,102,241,0.06)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Forecasted Month-End Spend</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
                  ₹{forecast.forecasted_month_end_expense.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Based on ₹{forecast.daily_average_burn_rate}/day rate
                </div>
              </div>
            </div>

            {/* Burn Progress Bar */}
            {forecast.current_budget && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Budget Burn Target</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    ₹{forecast.current_month_spent.toLocaleString('en-IN')} / ₹{forecast.current_budget.toLocaleString('en-IN')} ({Math.round((forecast.current_month_spent / forecast.current_budget) * 100)}%)
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (forecast.current_month_spent / forecast.current_budget) * 100)}%`,
                    background: (forecast.current_month_spent / forecast.current_budget) >= 0.9 ? 'var(--accent-rose)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Breakdown Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Spending Distribution</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By Category</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {overview.categories_breakdown.slice(0, 5).map((cat) => (
              <div key={cat.category_id || cat.category_name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ color: '#fff', fontWeight: 500 }}>{cat.category_name}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    ₹{cat.total_amount.toLocaleString('en-IN')} ({cat.percentage}%)
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.percentage}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spending Heatmap Component */}
      <SpendingHeatmap heatmapData={overview.spending_heatmap} />

      {/* Recent Transactions Table */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Recent Activity & AI Categorization</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Automatically parsed and tagged with confidence scoring.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="btn btn-secondary btn-sm"
          >
            View Full Ledger
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction</th>
                <th>Category</th>
                <th>AI Confidence</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {overview.recent_transactions.map((t) => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.date}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{t.description}</div>
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
                      background: `${t.category_color}20`,
                      color: t.category_color,
                      border: `1px solid ${t.category_color}40`
                    }}>
                      {t.category_name}
                    </span>
                  </td>
                  <td>
                    {t.is_anomaly ? (
                      <span className="badge badge-anomaly">
                        <Flame size={12} /> Outlier Spike
                      </span>
                    ) : (
                      <span className="badge badge-ai">
                        <Sparkles size={11} /> {Math.round(t.confidence_score * 100)}% match
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f8fafc' }}>
                    {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleCreateTransaction}
        categories={categories}
      />
      <ImportCsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={fetchData}
      />
    </div>
  );
};

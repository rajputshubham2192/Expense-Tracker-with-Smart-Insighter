import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BudgetModal } from '../components/BudgetModal';
import { 
  Target, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  Trash2 
} from 'lucide-react';

export const Budgets = () => {
  const [budgetProgress, setBudgetProgress] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [progressData, catsData] = await Promise.all([
        api.getBudgetProgress(),
        api.getCategories()
      ]);
      setBudgetProgress(progressData);
      setCategories(catsData);
    } catch (err) {
      console.error('Error loading budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSaveBudget = async (formData) => {
    await api.createBudget(formData);
    fetchBudgets();
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Remove this budget limit?')) {
      await api.deleteBudget(id);
      fetchBudgets();
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.2rem' }}>
            Budget Targets & Spending Safeguards
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time burn progress tracking and forecast-based overspending warnings.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Set Budget Limit</span>
        </button>
      </div>

      {budgetProgress.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Target size={48} color="#6366f1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>No Budget Targets Set Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Establish overall monthly limits or assign category-specific caps (Food, Shopping, Utilities) to enable proactive AI overspending alarms.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {budgetProgress.map((b) => {
            const isCritical = b.is_overbudget || b.percentage_used >= 95;
            const isWarning = b.is_alert_triggered && !isCritical;

            return (
              <div key={b.budget_id} className="glass-card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.2rem' }}>
                      {b.category_name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Target Period: {b.month}/{b.year}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCritical ? (
                      <span className="badge badge-anomaly">
                        <Flame size={12} /> Over Limit ({b.percentage_used}%)
                      </span>
                    ) : isWarning ? (
                      <span className="badge badge-ai" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                        <AlertTriangle size={12} /> Warning ({b.percentage_used}%)
                      </span>
                    ) : (
                      <span className="badge badge-income">
                        <CheckCircle2 size={12} /> On Track ({b.percentage_used}%)
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteBudget(b.budget_id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Delete Budget"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Amount Progress Metrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Spent: </span>
                    <strong style={{ fontSize: '1.3rem', color: isCritical ? '#fb7185' : '#fff' }}>
                      ₹{b.spent.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Limit: </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      ₹{b.amount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, b.percentage_used)}%`,
                    background: isCritical 
                      ? 'var(--accent-rose)' 
                      : (isWarning ? 'var(--accent-amber)' : 'linear-gradient(90deg, #6366f1, #06b6d4)'),
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                {/* Forecast Sub-alert */}
                <div style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Predicted Month-End Total:</span>
                  <strong style={{ color: b.will_exceed_forecast ? '#fb7185' : '#34d399' }}>
                    ₹{b.forecasted_month_end_spend.toLocaleString('en-IN')} {b.will_exceed_forecast ? '(Will Exceed)' : '(Within Cap)'}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBudget}
        categories={categories}
      />
    </div>
  );
};

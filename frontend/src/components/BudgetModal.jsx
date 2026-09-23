import React, { useState } from 'react';
import { X, Target } from 'lucide-react';

export const BudgetModal = ({ isOpen, onClose, onSave, categories = [] }) => {
  const today = new Date();
  const [formData, setFormData] = useState({
    amount: '',
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    category_id: '',
    threshold_alert: 80
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      setError('Please provide a valid budget target amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        amount: parseFloat(formData.amount),
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        threshold_alert: parseFloat(formData.threshold_alert),
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget target');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Target size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Set Budget Target</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Track live progress and trigger overspend alerts.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Target Amount */}
          <div className="input-group">
            <label className="input-label">Budget Limit (₹)</label>
            <input
              type="number"
              step="100"
              className="input-control"
              placeholder="e.g. 25000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          {/* Scope / Category */}
          <div className="input-group">
            <label className="input-label">Scope / Category</label>
            <select
              className="input-control"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">🌐 Overall Monthly Total Budget</option>
              {categories.filter(c => c.type === 'expense').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month & Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Month</label>
              <select
                className="input-control"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Year</label>
              <input
                type="number"
                className="input-control"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Alert Threshold */}
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Warning Alert Threshold</label>
              <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>{formData.threshold_alert}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={formData.threshold_alert}
              onChange={(e) => setFormData({ ...formData, threshold_alert: e.target.value })}
              style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Triggers visual alert notifications when actual spend exceeds this percentage.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Set Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

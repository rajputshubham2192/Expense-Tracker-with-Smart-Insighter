import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { X, Sparkles, Check } from 'lucide-react';

export const TransactionModal = ({ isOpen, onClose, onSave, categories = [], initialData = null }) => {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI / Card',
    notes: '',
    category_id: '',
    is_recurring: false,
    recurring_frequency: 'monthly'
  });

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount,
        type: initialData.type,
        description: initialData.description,
        date: initialData.date,
        payment_method: initialData.payment_method || 'UPI / Card',
        notes: initialData.notes || '',
        category_id: initialData.category_id || '',
        is_recurring: initialData.is_recurring || false,
        recurring_frequency: initialData.recurring_frequency || 'monthly'
      });
    } else {
      setFormData({
        amount: '',
        type: 'expense',
        description: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'UPI / Card',
        notes: '',
        category_id: '',
        is_recurring: false,
        recurring_frequency: 'monthly'
      });
      setAiSuggestion(null);
    }
    setError('');
  }, [initialData, isOpen]);

  // Live NLP categorization as user types description
  useEffect(() => {
    if (!initialData && formData.description.trim().length >= 3) {
      const delayDebounce = setTimeout(async () => {
        try {
          setIsPredicting(true);
          const res = await api.autoCategorize(formData.description);
          setAiSuggestion(res);
          if (!formData.category_id && res.category_id) {
            setFormData(prev => ({ ...prev, category_id: res.category_id }));
          }
        } catch (e) {
          // ignore
        } finally {
          setIsPredicting(false);
        }
      }, 400);

      return () => clearTimeout(delayDebounce);
    }
  }, [formData.description, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      setError('Please provide an amount and description.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
              {initialData ? 'Edit Transaction' : 'Record New Transaction'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {initialData ? 'Corrections will automatically train the AI model.' : 'AI Categorizer will auto-classify your entry.'}
            </p>
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
          {/* Type Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                background: formData.type === 'expense' ? 'var(--accent-rose)' : 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                background: formData.type === 'income' ? 'var(--accent-emerald)' : 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Income (+)
            </button>
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label">Description / Merchant</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Swiggy Lunch, Netflix, Uber, Salary"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* AI Suggestion Banner */}
          {aiSuggestion && !initialData && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc' }}>
                <Sparkles size={14} />
                <span>AI Suggested: <strong>{aiSuggestion.category_name}</strong> ({Math.round(aiSuggestion.confidence_score * 100)}% match)</span>
              </div>
              <button
                type="button"
                onClick={() => aiSuggestion.category_id && setFormData({ ...formData, category_id: aiSuggestion.category_id })}
                style={{
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Apply
              </button>
            </div>
          )}

          {/* Amount & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="input-control"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Date</label>
              <input
                type="date"
                className="input-control"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="input-group">
            <label className="input-label">Category</label>
            <select
              className="input-control"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">-- Let AI Auto-Assign --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method & Recurring Checkbox */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div>
              <label className="input-label">Payment Mode</label>
              <select
                className="input-control"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="UPI / Card">UPI / QR Code</option>
                <option value="NetBanking">Net Banking</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
              <input
                type="checkbox"
                id="is_recurring_cb"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <label htmlFor="is_recurring_cb" style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Recurring / Subscription
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : (initialData ? 'Save & Teach AI' : 'Record Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

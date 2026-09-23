import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TransactionModal } from '../components/TransactionModal';
import { ImportCsvModal } from '../components/ImportCsvModal';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  UploadCloud, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Flame, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar
} from 'lucide-react';

export const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedType) params.type = selectedType;
      if (anomalyOnly) params.is_anomaly = true;

      const [txs, cats] = await Promise.all([
        api.getTransactions(params),
        api.getCategories()
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory, selectedType, anomalyOnly]);

  const handleSaveTransaction = async (formData) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction.id, formData);
    } else {
      await api.createTransaction(formData);
    }
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.deleteTransaction(id);
        setTransactions(transactions.filter(t => t.id !== id));
      } catch (err) {
        alert('Failed to delete transaction.');
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.2rem' }}>
            Transaction Ledger
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Search, filter, edit, or upload bank statement files. AI learns from your corrections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setIsCsvModalOpen(true)} className="btn btn-secondary">
            <UploadCloud size={16} color="#38bdf8" />
            <span>Import CSV</span>
          </button>
          <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Search description / payee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Category Filter */}
          <div>
            <select
              className="input-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              className="input-control"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Flow Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Anomaly Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="anomaly_toggle"
              checked={anomalyOnly}
              onChange={(e) => setAnomalyOnly(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-rose)' }}
            />
            <label htmlFor="anomaly_toggle" style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: 600, cursor: 'pointer' }}>
              ⚠️ Anomalies Only
            </label>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Payment Mode</th>
              <th>AI Confidence / Anomaly</th>
              <th style={{ textAlign: 'right' }}>Amount (₹)</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No transactions match your search or filter criteria.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{t.date}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{t.description}</div>
                    {t.is_recurring && (
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>🔄 Recurring Subscription</span>
                    )}
                  </td>
                  <td>
                    {t.category ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${t.category.color}20`,
                        color: t.category.color,
                        border: `1px solid ${t.category.color}40`
                      }}>
                        {t.category.name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Uncategorized</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t.payment_method}</td>
                  <td>
                    {t.is_anomaly ? (
                      <span className="badge badge-anomaly" title={`Outlier score: ${t.anomaly_score}`}>
                        <Flame size={12} /> Outlier Spike
                      </span>
                    ) : (
                      <span className="badge badge-ai">
                        <Sparkles size={11} /> {Math.round(t.confidence_score * 100)}% NLP
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f8fafc' }}>
                    {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.5rem' }}
                        title="Edit & Correct AI"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.35rem 0.5rem' }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
        categories={categories}
        initialData={editingTransaction}
      />
      <ImportCsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={fetchTransactions}
      />
    </div>
  );
};

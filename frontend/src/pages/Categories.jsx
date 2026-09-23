import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Tags, PlusCircle, Trash2, Check, Shield } from 'lucide-react';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setError('');
      await api.createCategory({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor,
        icon: 'Tag'
      });
      setNewCatName('');
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this custom category?')) {
      try {
        await api.deleteCategory(id);
        fetchCategories();
      } catch (err) {
        alert(err.message || 'Cannot delete default category');
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.2rem' }}>
          Category Architecture
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          System default and user-defined custom categories leveraged by the NLP classification pipeline.
        </p>
      </div>

      <div className="grid-2">
        {/* Create Category Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <PlusCircle size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Add Custom Category</h3>
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCreate}>
            <div className="input-group">
              <label className="input-label">Category Name</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Pet Care, Education, Gaming"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label className="input-label">Type</label>
                <select
                  className="input-control"
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="input-label">Accent Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{newCatColor}</span>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Custom Category
            </button>
          </form>
        </div>

        {/* Existing Categories List */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Configured Categories ({categories.length})</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default + User</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {categories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.color }} />
                  <div>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{c.name}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: c.type === 'income' ? '#34d399' : '#f43f5e', textTransform: 'capitalize' }}>
                      ({c.type})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {c.is_default ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <Shield size={12} /> System
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                      title="Delete custom category"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

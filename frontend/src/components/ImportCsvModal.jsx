import React, { useState } from 'react';
import { api } from '../api/client';
import { X, UploadCloud, FileText, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export const ImportCsvModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV or bank statement file.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.uploadCsv(formData);
      setResult(res);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to parse and import bank statement.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Import Bank Statement / CSV</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Supports SBI, HDFC, ICICI, Axis, Paytm Bank & Generic CSV formats.
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

        {!result ? (
          <div>
            {/* File Dropzone */}
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                transition: 'border-color 0.2s'
              }}
              onClick={() => document.getElementById('csv-file-input').click()}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <UploadCloud size={40} color="#6366f1" style={{ margin: '0 auto 0.75rem' }} />
              {file ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem' }}>
                    <FileText size={16} />
                    <span>{file.name}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {(file.size / 1024).toFixed(1)} KB — Ready to parse
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Click to browse or drop your CSV file here
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Auto-runs NLP Categorizer & Isolation Forest Anomaly Detection
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="btn btn-primary"
                disabled={!file || isUploading}
              >
                {isUploading ? 'Parsing & Categorizing...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        ) : (
          /* Success Summary Matrix */
          <div>
            <div style={{
              padding: '1.25rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, marginBottom: '0.75rem' }}>
                <CheckCircle2 size={18} />
                <span>Import & AI Classification Completed!</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Processed:</span>
                  <strong style={{ marginLeft: '0.4rem', color: '#fff' }}>{result.total_processed}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Successfully Logged:</span>
                  <strong style={{ marginLeft: '0.4rem', color: '#10b981' }}>{result.successful_imports}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>AI Categorized:</span>
                  <strong style={{ marginLeft: '0.4rem', color: '#a5b4fc' }}>{result.categories_assigned_by_ai}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Anomalies Flagged:</span>
                  <strong style={{ marginLeft: '0.4rem', color: result.anomalies_detected > 0 ? '#f43f5e' : '#fff' }}>
                    {result.anomalies_detected}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  onClose();
                }}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

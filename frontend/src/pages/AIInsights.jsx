import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Sparkles, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Lightbulb, 
  Compass,
  ArrowRight,
  ShieldAlert,
  Zap
} from 'lucide-react';

export const AIInsights = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [persona, setPersona] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAIDiagnostics = async () => {
    try {
      setLoading(true);
      const [anomData, subData, personaData, recData, forecastData] = await Promise.all([
        api.getAnomalies(),
        api.getRecurringSubscriptions(),
        api.getSpendingPersona(),
        api.getRecommendations(),
        api.getForecast()
      ]);
      setAnomalies(anomData);
      setSubscriptions(subData);
      setPersona(personaData);
      setRecommendations(recData);
      setForecast(forecastData);
    } catch (err) {
      console.error('Failed to load AI diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Executing Isolation Forest & NLP Diagnostics...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Sparkles size={24} color="#38bdf8" />
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>
              Smart Insighter™ AI Diagnostics
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Machine learning intelligence suite: Anomaly Detection, Subscription Price Hikes & Persona Clustering.
          </p>
        </div>

        <button onClick={fetchAIDiagnostics} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          <span>Re-Run AI Inference</span>
        </button>
      </div>

      {/* Top 2-Column: Persona & Forecast Summary */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Spending Persona (K-Means Clustering) */}
        {persona && (
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(17, 23, 38, 0.8) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>AI Financial Persona</h3>
              </div>
              <span className="badge badge-ai" style={{ fontSize: '0.75rem' }}>
                {persona.badge}
              </span>
            </div>

            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.5rem' }}>
              {persona.persona}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              {persona.description}
            </p>

            {persona.metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Food</div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{persona.metrics.food_ratio}%</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Shopping</div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{persona.metrics.shop_ratio}%</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Essentials</div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{persona.metrics.essential_ratio}%</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lifestyle</div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{persona.metrics.lifestyle_ratio}%</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Burn Rate & Projections */}
        {forecast && (
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(17, 23, 38, 0.8) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="#06b6d4" />
                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Spending Velocity Telemetry</h3>
              </div>
              <span className={`badge ${forecast.spending_trend_direction === 'UPWARD' ? 'badge-anomaly' : 'badge-income'}`}>
                Trend: {forecast.spending_trend_direction}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Burn Velocity:</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                  ₹{forecast.daily_average_burn_rate?.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> /day</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Forecasted Month-End:</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
                  ₹{forecast.forecasted_month_end_expense?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              💡 Estimated monthly savings buffer remaining: <strong style={{ color: '#34d399' }}>₹{forecast.predicted_savings?.toLocaleString('en-IN')}</strong>
            </div>

          </div>
        )}
      </div>

      {/* Anomaly Outlier Detection Section */}
      <div className="glass-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={20} color="#f43f5e" />
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>
                Anomaly & Outlier Scanner (Isolation Forest)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Identifies statistical deviations, sudden price surges, and unusual payees.
              </p>
            </div>
          </div>
          <span className="badge badge-anomaly">
            {anomalies.length} Flagged
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
            <span>All transactions are within normal statistical distribution parameters.</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Anomaly Reason</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr key={a.transaction_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.date}</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{a.description}</td>
                    <td>
                      <span className="badge badge-ai">{a.category_name}</span>
                    </td>
                    <td style={{ color: '#fb7185', fontSize: '0.825rem' }}>
                      <Flame size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {a.reason}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#f43f5e' }}>
                      ₹{a.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recurring Subscriptions & Price Hikes */}
      <div className="glass-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <RefreshCw size={20} color="#38bdf8" />
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Recurring Subscriptions & Price Hike Tracker
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Automatically tracks billing cadences and detects hidden subscription cost increases.
            </p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No recurring subscription streams detected yet.
          </div>
        ) : (
          <div className="grid-2">
            {subscriptions.map((sub, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.2rem',
                  background: sub.is_price_hike ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: sub.is_price_hike ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem', color: '#fff' }}>{sub.merchant}</strong>
                  {sub.is_price_hike ? (
                    <span className="badge badge-anomaly">
                      <TrendingUp size={12} /> +{sub.price_change_percent}% Price Hike
                    </span>
                  ) : (
                    <span className="badge badge-income">
                      Price Stable
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Billing:</span>
                  <strong style={{ color: '#fff' }}>₹{sub.current_amount?.toLocaleString('en-IN')} ({sub.frequency})</strong>
                </div>

                {sub.previous_amount && sub.is_price_hike && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#fb7185', marginBottom: '0.4rem' }}>
                    <span>Previous Price:</span>
                    <span>₹{sub.previous_amount?.toLocaleString('en-IN')}</span>
                  </div>
                )}


                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                  Next estimated renewal: <strong>{sub.next_expected_date}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Savings Recommendations */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Lightbulb size={20} color="#f59e0b" />
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Actionable AI Savings Recommendations
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tailored optimization strategies generated from your spending anomalies and wealth targets.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              style={{
                padding: '1.25rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className={`badge ${rec.priority === 'HIGH' ? 'badge-anomaly' : 'badge-ai'}`}>
                    {rec.priority} PRIORITY
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{rec.title}</strong>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {rec.description}
                </p>
              </div>

              <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Potential Annual Savings</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                  +₹{rec.potential_savings.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

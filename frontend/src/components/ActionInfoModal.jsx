import React, { useState, useEffect } from 'react';
import { getIncident } from '../services/api.js';

export default function ActionInfoModal({ isOpen, type, incidentId: initialIncidentId, onClose }) {
  const [searchId, setSearchId] = useState('');
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      if (initialIncidentId) {
        setSearchId(String(initialIncidentId));
        fetchIncidentData(initialIncidentId);
      }
    } else {
      // Reset state on modal close
      setIncident(null);
      setError('');
      setLoading(false);
      setHasSearched(false);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIncidentId]);

  const fetchIncidentData = async (id) => {
    const cleanId = String(id).trim().replace('#', '');
    if (!cleanId || isNaN(cleanId)) {
      setError('Please enter a valid numeric incident reference ID.');
      setIncident(null);
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const data = await getIncident(cleanId);
      setIncident(data);
    } catch (err) {
      console.error('Track error:', err);
      setError(
        err.message?.includes('not found') || err.message?.includes('404')
          ? `Incident #${cleanId} was not found in the database. Please verify the number.`
          : `Unable to fetch incident details: ${err.message}`
      );
      setIncident(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId) {
      fetchIncidentData(searchId);
    }
  };

  if (!isOpen) return null;

  const isReport = type === 'report';

  const getStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'REPORTED':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'AI ANALYZED':
        return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' };
      case 'PRIORITIZED':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'ASSIGNED':
        return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'IN PROGRESS':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' };
      case 'REPAIR COMPLETED':
      case 'VERIFIED':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'CLOSED':
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  const getStageIndex = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'REPORTED') return 0;
    if (s === 'AI ANALYZED' || s === 'PRIORITIZED') return 1;
    if (s === 'ASSIGNED') return 2;
    if (s === 'IN PROGRESS') return 3;
    if (s === 'REPAIR COMPLETED' || s === 'VERIFIED' || s === 'CLOSED') return 4;
    return 0;
  };

  const lifecycleStages = ['Reported', 'AI Triage', 'Assigned', 'In Progress', 'Resolved'];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-box"
        style={{ maxWidth: type === 'track' ? 560 : 480, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-icon-badge" aria-hidden="true">
            {isReport ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {type === 'track' ? (
            <>
              <span className="modal-status-badge">CIVICSHIELD AI · LIVE INCIDENT TRACKER</span>
              <h3 className="modal-title">Track Complaint Status</h3>
              <p className="modal-desc" style={{ marginBottom: 12 }}>
                Enter your reference ID to monitor real-time AI triage, departmental assignment, and resolution progress.
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit'
                  }}
                  aria-label="Incident Reference ID"
                />
                <button
                  type="submit"
                  disabled={loading || !searchId.trim()}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
                >
                  {loading ? 'Searching...' : 'Track'}
                </button>
              </form>

              {/* Quick sample chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Quick lookup:</span>
                {[1, 2, 3, 4].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSearchId(String(id));
                      fetchIncidentData(id);
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#334155'
                    }}
                  >
                    #{id}
                  </button>
                ))}
              </div>

              {/* Error state */}
              {error && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    marginBottom: 16
                  }}
                >
                  {error}
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  <div className="location-spinner" style={{ margin: '0 auto 12px' }}></div>
                  <span>Querying CIVICSHIELD database...</span>
                </div>
              )}

              {/* Incident Details Card */}
              {incident && !loading && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                  }}
                >
                  {/* Top Bar: Reference ID & Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>REFERENCE</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                        #{incident.id}
                      </div>
                    </div>
                    {(() => {
                      const colors = getStatusColor(incident.status);
                      return (
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: 9999,
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`
                          }}
                        >
                          {incident.status || 'REPORTED'}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Lifecycle Stepper */}
                  <div style={{ marginTop: 4, marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      {lifecycleStages.map((stage, idx) => {
                        const currentIdx = getStageIndex(incident.status);
                        const isDone = idx <= currentIdx;
                        return (
                          <div
                            key={stage}
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: idx === currentIdx ? 800 : 600,
                              color: idx === currentIdx ? '#2563eb' : isDone ? '#059669' : '#94a3b8',
                              textAlign: 'center',
                              flex: 1
                            }}
                          >
                            {stage}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      {lifecycleStages.map((_, idx) => {
                        const currentIdx = getStageIndex(incident.status);
                        const isDone = idx <= currentIdx;
                        return (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              backgroundColor: isDone ? (idx === currentIdx ? '#2563eb' : '#10b981') : 'transparent',
                              borderRight: idx < lifecycleStages.length - 1 ? '2px solid #fff' : 'none'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Scores (if scored) */}
                  {(incident.priority_score > 0 || incident.severity > 0) && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        background: '#fff',
                        padding: 10,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>SEVERITY</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {incident.severity}/100
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>RISK</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {incident.risk_score}/100
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>PRIORITY</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>
                          {incident.priority_score}/100
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Information Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Department:
                      </strong>
                      <div style={{ color: 'var(--navy-950)', fontWeight: 600 }}>
                        {incident.department || 'Under departmental triage'}
                      </div>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Issue Type:
                      </strong>
                      <div style={{ color: 'var(--navy-950)', fontWeight: 600, textTransform: 'capitalize' }}>
                        {incident.issue_type || 'General'}
                      </div>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Description:
                      </strong>
                      <div style={{ color: 'var(--navy-900)', marginTop: 2, background: '#fff', padding: '6px 10px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        {incident.description}
                      </div>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Location:
                      </strong>
                      <div style={{ color: 'var(--navy-900)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                        Lat: {incident.latitude}, Long: {incident.longitude}
                      </div>
                    </div>

                    {incident.image_url && (
                      <div>
                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Photo Evidence:
                        </strong>
                        <img
                          src={incident.image_url}
                          alt="Incident Photo"
                          style={{ maxHeight: 160, width: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                        />
                      </div>
                    )}

                    {incident.created_at && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Reported on {new Date(incident.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <span className="modal-status-badge">CIVICSHIELD AI PLATFORM</span>
              <h3 className="modal-title">Citizen Infrastructure Action</h3>
              <p className="modal-desc">
                Report road damage, potholes, streetlights, or water leakage with live geo-tagging and AI-driven risk scoring.
              </p>
              <div className="modal-roadmap-card">
                <span className="roadmap-label">Direct Reporting:</span>
                <p className="roadmap-text">
                  You can file a new citizen report immediately using the "Report an Issue" button on the navigation bar.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {incident ? 'Close Tracker' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}


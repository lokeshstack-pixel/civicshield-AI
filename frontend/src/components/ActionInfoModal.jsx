import React, { useEffect } from 'react';

export default function ActionInfoModal({ isOpen, type, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isReport = type === 'report';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
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
          <span className="modal-status-badge">DEMO ROADMAP · STEP 2</span>
          <h3 className="modal-title">
            {isReport ? 'Citizen Issue Reporting' : 'Incident Status Tracker'}
          </h3>
          <p className="modal-desc">
            {isReport
              ? 'You are viewing the Step 2 Landing Page foundation. The interactive citizen incident reporting form with photo upload and AI triage will be implemented in the next step.'
              : 'Real-time incident tracking and authority resolution progress will be connected in future project steps.'}
          </p>

          <div className="modal-roadmap-card">
            <span className="roadmap-label">Current Step Status:</span>
            <p className="roadmap-text">
              Step 2: Professional Landing Page UI verified. Ready for Step 3 implementation upon instruction.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary w-full" onClick={onClose}>
            Continue Exploring Platform
          </button>
        </div>
      </div>
    </div>
  );
}


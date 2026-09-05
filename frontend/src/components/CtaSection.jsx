import React from 'react';

export default function CtaSection({ onOpenActionModal, onReportClick }) {
  return (
    <section id="report-cta" className="cta-section">
      <div className="container">
        <div className="cta-card">
          <div className="cta-content">
            <span className="cta-eyebrow">COMMUNITY INFRASTRUCTURE ACTION</span>
            <h2 className="cta-heading">See an infrastructure problem?</h2>
            <p className="cta-text">
              Report it. CIVICSHIELD AI helps turn citizen observations into actionable infrastructure intelligence.
            </p>
            <div className="cta-btn-wrap">
              <button
                type="button"
                className="btn btn-primary btn-lg cta-action-btn"
                onClick={onReportClick}
              >
                REPORT AN ISSUE
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

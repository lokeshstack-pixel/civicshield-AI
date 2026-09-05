import React from 'react';
import WorkflowVisual from './WorkflowVisual.jsx';

export default function Hero({ onOpenActionModal, onReportClick }) {
  return (
    <section id="hero" className="hero-section">
      <div className="container hero-grid">
        {/* Left Column: Headlines & Call to Actions */}
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true"></span>
            <span>NEXT-GEN CIVIC INFRASTRUCTURE INTELLIGENCE</span>
          </div>

          <h1 className="hero-headline">
            Transforming Citizen Complaints <br className="desktop-break" />
            <span className="headline-gradient">into Intelligent Infrastructure Action.</span>
          </h1>

          <p className="hero-description">
            CIVICSHIELD AI uses artificial intelligence and location intelligence to understand civic issues, 
            assess risk, prioritize urgent problems, and help authorities respond faster.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onReportClick}
            >
              REPORT AN ISSUE
            </button>
            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={() => onOpenActionModal('track')}
            >
              TRACK A COMPLAINT
            </button>
          </div>

          <div className="hero-proof-points">
            <div className="proof-item">
              <svg className="proof-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Public Infrastructure Grade</span>
            </div>
            <div className="proof-divider" aria-hidden="true">•</div>
            <div className="proof-item">
              <svg className="proof-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Automated Priority Escalation</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Visual */}
        <div className="hero-visual-col">
          <WorkflowVisual />
        </div>
      </div>
    </section>
  );
}

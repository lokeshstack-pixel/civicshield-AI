import React from 'react';

export default function WorkflowVisual() {
  return (
    <div className="workflow-card-wrapper">
      <div className="workflow-card">
        {/* Terminal / Panel Header */}
        <div className="workflow-header">
          <div className="workflow-header-left">
            <span className="live-indicator" aria-hidden="true"></span>
            <span className="workflow-header-title">INCIDENT INTELLIGENCE PIPELINE</span>
          </div>
          <span className="workflow-tag">LIVE TRIAGE</span>
        </div>

        {/* Step 1: Citizen Report */}
        <div className="workflow-stage stage-report">
          <div className="stage-marker">
            <span className="stage-num">01</span>
            <span className="stage-line" aria-hidden="true"></span>
          </div>
          <div className="stage-content">
            <div className="stage-top">
              <span className="stage-badge badge-blue">CITIZEN INPUT</span>
              <span className="stage-id">#CS-2849</span>
            </div>
            <h4 className="stage-title">Deep Pothole & Roadway Fracture</h4>
            <div className="stage-chips">
              <span className="chip">
                <svg className="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Main Ave & 4th Cross
              </span>
              <span className="chip">
                <svg className="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Photo Attached
              </span>
            </div>
          </div>
        </div>

        {/* Transformation Connector */}
        <div className="workflow-connector" aria-hidden="true">
          <div className="connector-pill">
            <svg className="connector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span>AI Risk & Perception Analysis</span>
          </div>
        </div>

        {/* Step 2: AI Analysis & Prioritization */}
        <div className="workflow-stage stage-ai">
          <div className="stage-marker">
            <span className="stage-num stage-num-active">02</span>
            <span className="stage-line" aria-hidden="true"></span>
          </div>
          <div className="stage-content">
            <div className="stage-top">
              <span className="stage-badge badge-amber">AI EVALUATION</span>
              <span className="priority-tag high-priority">HIGH RISK · SEVERITY 86%</span>
            </div>
            <h4 className="stage-title">High-Traffic Transit Corridor Hazard</h4>
            <div className="risk-metric-bar">
              <div className="risk-progress" style={{ width: '86%' }} aria-label="Risk score 86 out of 100"></div>
            </div>
            <p className="stage-note">
              Automated classification: High vehicular volume + depth &gt; 8cm. Automated priority escalation triggered.
            </p>
          </div>
        </div>

        {/* Transformation Connector */}
        <div className="workflow-connector" aria-hidden="true">
          <div className="connector-pill">
            <svg className="connector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>Automated Authority Routing</span>
          </div>
        </div>

        {/* Step 3: Authority Action */}
        <div className="workflow-stage stage-action">
          <div className="stage-marker">
            <span className="stage-num">03</span>
          </div>
          <div className="stage-content">
            <div className="stage-top">
              <span className="stage-badge badge-emerald">AUTHORITY ACTION</span>
              <span className="stage-status">DISPATCHED</span>
            </div>
            <h4 className="stage-title">Public Works — Rapid Repair Crew #4</h4>
            <div className="stage-chips">
              <span className="chip chip-success">
                <svg className="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Work Order Created
              </span>
              <span className="chip">Target Response: &lt; 4 Hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import React from 'react';

export default function CivicImpact() {
  const challengePoints = [
    { label: 'Scattered Intake', desc: 'Disparate reporting channels create duplicate submissions and lost reports.' },
    { label: 'Difficult to Prioritize', desc: 'Without risk quantification, minor complaints obscure critical road and structural hazards.' },
    { label: 'Manually Assessed', desc: 'Slow manual review bottlenecks municipal teams and delays emergency repairs.' },
    { label: 'Disconnected Location Data', desc: 'Missing geographic context impedes dispatch efficiency and route coordination.' },
  ];

  return (
    <section id="civic-impact" className="civic-impact-section">
      <div className="container">
        <div className="impact-grid">
          {/* Left: Problem Statement & Thesis */}
          <div className="impact-left">
            <span className="section-eyebrow">THE CIVIC CHALLENGE</span>
            <h2 className="impact-heading">
              Cities don't lack complaints. <br />
              <span className="impact-heading-accent">They lack intelligent prioritization.</span>
            </h2>
            <p className="impact-lead">
              Municipal departments across the globe are overwhelmed by volume, but starved of actionable context. 
              Traditional grievance portals capture data, but leave the heavy burden of triage to human personnel.
            </p>
            <div className="solution-callout">
              <div className="solution-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="solution-text">
                <strong>The CIVICSHIELD AI Solution:</strong>
                <p>
                  We convert unstructured citizen reports into structured, prioritized infrastructure intelligence—empowering 
                  authorities to protect communities proactively rather than reactively.
                </p>
              </div>
            </div>
          </div>

          {/* Right: The Breakdown of Current Civic Obstacles */}
          <div className="impact-right">
            <div className="impact-card">
              <h3 className="impact-card-title">Traditional Civic Triage Obstacles</h3>
              <ul className="challenges-list">
                {challengePoints.map((item, idx) => (
                  <li key={idx} className="challenge-item">
                    <div className="challenge-bullet" aria-hidden="true">
                      <span className="bullet-dash"></span>
                    </div>
                    <div>
                      <strong className="challenge-label">{item.label}:</strong>
                      <span className="challenge-desc"> {item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="transformation-summary">
                <span className="summary-tag">CIVICSHIELD IMPACT</span>
                <p className="summary-quote">
                  "Turning raw citizen observations into precision-routed municipal action."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


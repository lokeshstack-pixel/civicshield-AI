import React from 'react';

export default function FeatureCards() {
  const features = [
    {
      title: 'AI INCIDENT ANALYSIS',
      tagline: 'Analyze submitted infrastructure images and descriptions.',
      details:
        'Computer vision models classify road damage, water leaks, and structural faults directly from citizen photos, pairing visual evidence with natural language processing of the report description.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      title: 'RISK-BASED PRIORITIZATION',
      tagline: 'Convert severity and risk into actionable priority.',
      details:
        'Multi-criteria algorithmic assessment scores incident severity by factoring defect depth, physical danger, traffic density, and proximity to schools and transit nodes to calculate true municipal urgency.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
    },
    {
      title: 'GEO-AWARE RESPONSE',
      tagline: 'Connect incidents with their exact geographic context.',
      details:
        'Location intelligence associates every verified report with municipal boundary maps, jurisdictional responsibility, and adjacent ongoing repairs to eliminate redundancy and streamline crew dispatch.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-eyebrow">CORE CAPABILITIES</span>
          <h2 className="section-title">Built for Real-World Municipal Operations</h2>
          <p className="section-subtitle">
            Reliable civic engineering technology designed to support city engineers, dispatchers, and residents.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feat, idx) => (
            <article key={idx} className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-wrapper" aria-hidden="true">
                  {feat.icon}
                </div>
                <span className="feature-idx">0{idx + 1}</span>
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-tagline">{feat.tagline}</p>
              <div className="feature-divider" aria-hidden="true"></div>
              <p className="feature-details">{feat.details}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


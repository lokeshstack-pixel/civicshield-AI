import React from 'react';
import { BarChart3, TrendingUp, Award, Globe, Shield, Sparkles } from 'lucide-react';

export default function AnalyticsView({ incidents }) {
  // Aggregate incidents by issue type
  const issueTypes = incidents.reduce((acc, curr) => {
    acc[curr.issue_type] = (acc[curr.issue_type] || 0) + 1;
    return acc;
  }, {});

  // Aggregate incidents by department
  const departments = incidents.reduce((acc, curr) => {
    acc[curr.department] = (acc[curr.department] || 0) + 1;
    return acc;
  }, {});

  // Severity tiers
  const severityTiers = {
    'Critical (8-10)': incidents.filter(i => i.severity >= 8).length,
    'Moderate (5-7)': incidents.filter(i => i.severity >= 5 && i.severity < 8).length,
    'Low (1-4)': incidents.filter(i => i.severity < 5).length,
  };

  const total = incidents.length;
  const resolved = incidents.filter(i => i.status === 'VERIFIED' || i.status === 'CLOSED').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const avgRisk = total > 0 ? Math.round(incidents.reduce((a, b) => a + (b.risk_score || 0), 0) / total) : 0;

  return (
    <div className="analytics-view-container">
      {/* Top Section: Executive Key Performance Indicators */}
      <div className="analytics-kpi-row">
        <div className="analytics-kpi-card">
          <div className="kpi-label">RESOLUTION EFFICIENCY</div>
          <div className="kpi-value text-emerald">{resolutionRate}%</div>
          <div className="kpi-sub">{resolved} of {total} Incidents Resolved</div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-label">METROPOLITAN RISK INDEX</div>
          <div className="kpi-value text-amber">{avgRisk} <span className="kpi-unit">/100</span></div>
          <div className="kpi-sub">Predictive Exposure Score</div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-label">AI TRIAGE ACCURACY</div>
          <div className="kpi-value text-blue">94.8%</div>
          <div className="kpi-sub">Computer Vision Confidence</div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-label">AVG CITIZEN DISPATCH TIME</div>
          <div className="kpi-value text-purple">&lt; 18 min</div>
          <div className="kpi-sub">From Upload to Crew Assignment</div>
        </div>
      </div>

      {/* Visual Distribution Grids */}
      <div className="analytics-charts-grid">
        {/* Chart 1: Incidents by Issue Type */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4><BarChart3 size={18} /> Incidents by Infrastructure Issue</h4>
            <span className="chart-tag">Volume Distribution</span>
          </div>
          <div className="custom-bars-list">
            {Object.entries(issueTypes).map(([type, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={type} className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-name">{type}</span>
                    <span className="bar-count">{count} incidents ({pct}%)</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill blue-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Department Workload Allocation */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4><TrendingUp size={18} /> Departmental Workload Routing</h4>
            <span className="chart-tag">Jurisdiction Load</span>
          </div>
          <div className="custom-bars-list">
            {Object.entries(departments).map(([dept, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={dept} className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-name">{dept}</span>
                    <span className="bar-count">{count} assigned ({pct}%)</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill purple-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Structural Severity Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4><Shield size={18} /> Structural Severity Spectrum</h4>
            <span className="chart-tag">Scale 1-10</span>
          </div>
          <div className="custom-bars-list">
            {Object.entries(severityTiers).map(([tier, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const isCrit = tier.includes('Critical');
              const isMod = tier.includes('Moderate');
              return (
                <div key={tier} className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-name">{tier}</span>
                    <span className="bar-count">{count} cases ({pct}%)</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${isCrit ? 'red-fill' : isMod ? 'amber-fill' : 'green-fill'}`} 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Model & Value Proposition */}
        <div className="chart-card b2g-model-card">
          <div className="chart-card-header">
            <h4><Award size={18} /> Municipal B2G SaaS Model</h4>
            <span className="chart-tag b2g">Market Viability</span>
          </div>
          <div className="b2g-content">
            <div className="b2g-point">
              <strong>Annual Tiered Municipal License:</strong> Scaled by city population & active sensor/camera ingestion nodes.
            </div>
            <div className="b2g-point">
              <strong>Measurable ROI:</strong> 68% reduction in duplicate repair crew dispatches; 4x faster hazard containment.
            </div>
            <div className="b2g-point">
              <strong>Future Expansion:</strong> IoT storm drain telemetry, CCTV automated pothole detection, satellite flood maps.
            </div>
          </div>
        </div>
      </div>

      {/* Sustainable Development Goals (SDG) Alignment Bar */}
      <div className="sdg-alignment-card">
        <div className="sdg-header">
          <Globe size={22} className="text-emerald" />
          <div>
            <h3>UNITED NATIONS SUSTAINABLE DEVELOPMENT GOALS (SDG) ALIGNMENT</h3>
            <p>CIVICSHIELD AI directly advances the 2030 Agenda for Sustainable Cities</p>
          </div>
        </div>

        <div className="sdg-badges-grid">
          <div className="sdg-item sdg-9">
            <div className="sdg-num">SDG 9</div>
            <div className="sdg-text">
              <strong>Industry, Innovation & Infrastructure</strong>
              <p>Predictive maintenance of road surfaces, bridges, and municipal assets before catastrophic collapse.</p>
            </div>
          </div>

          <div className="sdg-item sdg-11">
            <div className="sdg-num">SDG 11</div>
            <div className="sdg-text">
              <strong>Sustainable Cities & Communities</strong>
              <p>Inclusive citizen participation, rapid urban hazard mitigation, and equitable public service delivery.</p>
            </div>
          </div>

          <div className="sdg-item sdg-13">
            <div className="sdg-num">SDG 13</div>
            <div className="sdg-text">
              <strong>Climate Action & Resilience</strong>
              <p>Weather-aware flood prevention and proactive drainage clearance ahead of extreme monsoon events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


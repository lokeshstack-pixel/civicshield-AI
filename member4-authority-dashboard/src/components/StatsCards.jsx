import React from 'react';
import { AlertOctagon, Flame, Clock, CheckCircle2, FileText, Activity } from 'lucide-react';

export default function StatsCards({ incidents, onFilterSelect, activeFilter }) {
  const total = incidents.length;
  const critical = incidents.filter(i => i.priority_level === 'CRITICAL').length;
  const highRisk = incidents.filter(i => i.risk_score >= 75).length;
  const pending = incidents.filter(i => i.status === 'REPORTED' || i.status === 'ASSIGNED').length;
  const resolved = incidents.filter(i => i.status === 'VERIFIED' || i.status === 'CLOSED').length;
  
  const avgRisk = total > 0 
    ? Math.round(incidents.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / total) 
    : 0;

  return (
    <div className="stats-grid">
      <div 
        className={`stat-card stat-total ${activeFilter === 'ALL' ? 'selected' : ''}`}
        onClick={() => onFilterSelect && onFilterSelect('ALL')}
      >
        <div className="stat-card-header">
          <span className="stat-title">TOTAL INCIDENTS</span>
          <div className="stat-icon-wrapper total">
            <FileText size={20} />
          </div>
        </div>
        <div className="stat-main">
          <span className="stat-number">{total}</span>
          <span className="stat-pill neutral">Active City Scope</span>
        </div>
        <div className="stat-subtext">Consolidated citizen reports</div>
      </div>

      <div 
        className={`stat-card stat-critical ${activeFilter === 'CRITICAL' ? 'selected' : ''}`}
        onClick={() => onFilterSelect && onFilterSelect('CRITICAL')}
      >
        <div className="stat-card-header">
          <span className="stat-title">CRITICAL DISPATCH</span>
          <div className="stat-icon-wrapper critical">
            <AlertOctagon size={20} className="animate-pulse" />
          </div>
        </div>
        <div className="stat-main">
          <span className="stat-number critical-text">{critical}</span>
          <span className="stat-pill critical-pill">Immediate Action</span>
        </div>
        <div className="stat-subtext">Priority Score &ge; 90</div>
      </div>

      <div 
        className={`stat-card stat-high-risk ${activeFilter === 'HIGH' ? 'selected' : ''}`}
        onClick={() => onFilterSelect && onFilterSelect('HIGH')}
      >
        <div className="stat-card-header">
          <span className="stat-title">HIGH RISK POTENTIAL</span>
          <div className="stat-icon-wrapper risk">
            <Flame size={20} />
          </div>
        </div>
        <div className="stat-main">
          <span className="stat-number">{highRisk}</span>
          <span className="stat-pill risk-pill">Weather & Escalation</span>
        </div>
        <div className="stat-subtext">Risk Score &ge; 75/100</div>
      </div>

      <div 
        className={`stat-card stat-pending ${activeFilter === 'PENDING' ? 'selected' : ''}`}
        onClick={() => onFilterSelect && onFilterSelect('PENDING')}
      >
        <div className="stat-card-header">
          <span className="stat-title">PENDING DISPATCH</span>
          <div className="stat-icon-wrapper pending">
            <Clock size={20} />
          </div>
        </div>
        <div className="stat-main">
          <span className="stat-number">{pending}</span>
          <span className="stat-pill pending-pill">Awaiting Crew</span>
        </div>
        <div className="stat-subtext">Unassigned or reported</div>
      </div>

      <div 
        className={`stat-card stat-resolved ${activeFilter === 'RESOLVED' ? 'selected' : ''}`}
        onClick={() => onFilterSelect && onFilterSelect('RESOLVED')}
      >
        <div className="stat-card-header">
          <span className="stat-title">VERIFIED / RESOLVED</span>
          <div className="stat-icon-wrapper resolved">
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="stat-main">
          <span className="stat-number">{resolved}</span>
          <span className="stat-pill resolved-pill">AI Inspected</span>
        </div>
        <div className="stat-subtext">Before & After matched</div>
      </div>

      <div className="stat-card stat-index">
        <div className="stat-card-header">
          <span className="stat-title">AVG CITY RISK INDEX</span>
          <div className="stat-icon-wrapper index">
            <Activity size={20} />
          </div>
        </div>
        <div className="stat-main">
          <span className="stat-number index-text">{avgRisk}</span>
          <span className="stat-sub-unit">/ 100</span>
        </div>
        <div className="stat-progress-bar">
          <div 
            className="stat-progress-fill" 
            style={{ width: `${avgRisk}%`, backgroundColor: avgRisk > 75 ? '#ef4444' : avgRisk > 50 ? '#f59e0b' : '#10b981' }}
          ></div>
        </div>
      </div>
    </div>
  );
}


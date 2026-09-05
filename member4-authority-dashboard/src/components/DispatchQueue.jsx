import React from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle, Clock, CloudRain, Shield, Users } from 'lucide-react';

export default function DispatchQueue({
  incidents,
  onSelectIncident,
  onAssignCrew,
  onQuickStatusChange
}) {
  // Automatically sort by Priority Score descending (highest urgency first)
  const sortedIncidents = [...incidents].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  const getPriorityBadgeClass = (level) => {
    switch (level) {
      case 'CRITICAL': return 'badge-p-critical';
      case 'HIGH': return 'badge-p-high';
      case 'MEDIUM': return 'badge-p-medium';
      case 'LOW': return 'badge-p-low';
      default: return 'badge-p-medium';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'REPORTED': return 'badge-s-reported';
      case 'ASSIGNED': return 'badge-s-assigned';
      case 'IN PROGRESS': return 'badge-s-progress';
      case 'COMPLETED': return 'badge-s-completed';
      case 'VERIFIED': return 'badge-s-verified';
      case 'CLOSED': return 'badge-s-closed';
      default: return 'badge-s-default';
    }
  };

  const getDepartmentClass = (dept) => {
    if (dept.includes('Roads')) return 'dept-roads';
    if (dept.includes('Drainage')) return 'dept-drainage';
    if (dept.includes('Electrical')) return 'dept-electrical';
    if (dept.includes('Sanitation')) return 'dept-sanitation';
    if (dept.includes('Disaster')) return 'dept-disaster';
    return 'dept-default';
  };

  return (
    <div className="dispatch-queue-container">
      <div className="dispatch-queue-header">
        <div className="queue-title-block">
          <h3>⚡ PRIORITY DISPATCH QUEUE</h3>
          <span className="queue-sort-badge">Sorted by AI Urgency Index &darr;</span>
        </div>
        <div className="queue-meta-stats">
          <span>{sortedIncidents.length} Dispatches Active</span>
        </div>
      </div>

      <div className="queue-table-wrapper">
        <table className="dispatch-table">
          <thead>
            <tr>
              <th>INCIDENT ID</th>
              <th>ISSUE & LOCATION</th>
              <th className="text-center">SEVERITY</th>
              <th className="text-center">RISK SCORE</th>
              <th className="text-center">PRIORITY</th>
              <th>ROUTED DEPARTMENT</th>
              <th>STATUS</th>
              <th className="text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sortedIncidents.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-queue-cell">
                  <AlertCircle size={28} className="empty-icon" />
                  <p>No incidents match the active search or filter criteria.</p>
                </td>
              </tr>
            ) : (
              sortedIncidents.map((item) => {
                const isCritical = item.priority_level === 'CRITICAL';
                return (
                  <tr 
                    key={item.id} 
                    className={`queue-row ${isCritical ? 'row-critical-alert' : ''}`}
                    onClick={() => onSelectIncident(item)}
                  >
                    {/* ID */}
                    <td className="cell-id">
                      <span className="id-code">{item.id}</span>
                      {isCritical && <span className="crit-ping"></span>}
                    </td>

                    {/* ISSUE & LOCATION */}
                    <td className="cell-issue">
                      <div className="issue-headline">{item.issue_type}</div>
                      <div className="issue-location-line">📍 {item.location_name || 'Captured GPS'}</div>
                      {item.weather_risk && item.weather_risk.includes('High') && (
                        <div className="weather-chip">
                          <CloudRain size={11} /> {item.weather_risk}
                        </div>
                      )}
                    </td>

                    {/* SEVERITY */}
                    <td className="cell-severity text-center">
                      <div className="severity-meter">
                        <span className="severity-val">{item.severity}</span>
                        <span className="severity-max">/10</span>
                      </div>
                      <div className="severity-bar-bg">
                        <div 
                          className="severity-bar-fill" 
                          style={{
                            width: `${(item.severity / 10) * 100}%`,
                            backgroundColor: item.severity >= 8 ? '#ef4444' : item.severity >= 5 ? '#f97316' : '#10b981'
                          }}
                        ></div>
                      </div>
                    </td>

                    {/* RISK SCORE */}
                    <td className="cell-risk text-center">
                      <div className="risk-score-badge">
                        <span className="risk-num">{item.risk_score}</span>
                        <span className="risk-scale">/100</span>
                      </div>
                      <span className="risk-sub-label">
                        {item.risk_score >= 80 ? 'Accident Surge' : item.risk_score >= 60 ? 'Elevated' : 'Controlled'}
                      </span>
                    </td>

                    {/* PRIORITY */}
                    <td className="cell-priority text-center">
                      <span className={`priority-tag ${getPriorityBadgeClass(item.priority_level)}`}>
                        {item.priority_level} ({item.priority_score})
                      </span>
                    </td>

                    {/* DEPARTMENT */}
                    <td className="cell-department">
                      <span className={`dept-pill ${getDepartmentClass(item.department)}`}>
                        {item.department}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="cell-status">
                      <span className={`status-pill ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                      {item.assigned_team && (
                        <div className="assigned-team-tag">
                          <Users size={11} /> {item.assigned_team}
                        </div>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="cell-actions text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-action-inspect"
                        onClick={() => onSelectIncident(item)}
                        title="Open full Incident Dossier"
                      >
                        Inspect <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


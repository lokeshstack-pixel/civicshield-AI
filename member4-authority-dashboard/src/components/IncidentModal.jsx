import React, { useState } from 'react';
import { 
  X, AlertTriangle, ShieldCheck, CheckCircle, Clock, MapPin, 
  Send, Users, Eye, Sparkles, CloudRain, Car, AlertOctagon, UploadCloud
} from 'lucide-react';

const CREW_OPTIONS = [
  "Road Maintenance Rapid Crew 1",
  "Asphalt Patch Team Alpha",
  "Drainage Clearance Taskforce 2",
  "Emergency Pumping Unit Alpha",
  "High-Voltage Electrical Response Beta",
  "Sanitation Zone 5 Fleet"
];

const WORKFLOW_STEPS = [
  "REPORTED",
  "AI ANALYZED",
  "PRIORITIZED",
  "ASSIGNED",
  "IN PROGRESS",
  "VERIFIED",
  "CLOSED"
];

export default function IncidentModal({
  incident,
  onClose,
  onUpdateStatus,
  onVerifyRepair
}) {
  const [selectedCrew, setSelectedCrew] = useState(incident?.assigned_team || CREW_OPTIONS[0]);
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' or 'repair'
  const [simulatingVerify, setSimulatingVerify] = useState(false);
  const [repairPhotoPreview, setRepairPhotoPreview] = useState(incident?.repair_image_url || null);
  const [verificationFeedback, setVerificationFeedback] = useState(incident?.repair_verified ? "AI Repair Verified: Structural defect resolved." : null);

  if (!incident) return null;

  const currentStepIndex = WORKFLOW_STEPS.indexOf(incident.status);

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    onUpdateStatus(incident.id, 'ASSIGNED', selectedCrew);
  };

  const handleSimulateRepairUpload = () => {
    // Demo simulation of crew uploading completion photo
    const sampleAfterPhoto = "https://images.unsplash.com/photo-1584463699039-b9d997d8c520?auto=format&fit=crop&w=800&q=80";
    setRepairPhotoPreview(sampleAfterPhoto);
  };

  const handleRunAiVerification = () => {
    setSimulatingVerify(true);
    setTimeout(() => {
      setSimulatingVerify(false);
      setVerificationFeedback("✅ AI VISION VERIFIED: Surface re-asphalted. Defect density 0%. Safe for traffic.");
      onVerifyRepair(incident.id, repairPhotoPreview || "https://images.unsplash.com/photo-1584463699039-b9d997d8c520?auto=format&fit=crop&w=800&q=80");
    }, 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dossier-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="incident-modal-badge">{incident.id}</span>
            <h2>{incident.issue_type}</h2>
            <span className={`priority-tag-modal ${incident.priority_level?.toLowerCase()}`}>
              {incident.priority_level} (Priority: {incident.priority_score})
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="workflow-stepper-bar">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = idx <= (currentStepIndex !== -1 ? currentStepIndex : 1);
            const isCurrent = idx === currentStepIndex;

            return (
              <div 
                key={step} 
                className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                onClick={() => onUpdateStatus(incident.id, step, incident.assigned_team)}
                title={`Click to set status to ${step}`}
              >
                <div className="step-circle">
                  {isCompleted ? <CheckCircle size={12} /> : idx + 1}
                </div>
                <span className="step-label">{step}</span>
                {idx < WORKFLOW_STEPS.length - 1 && <div className="step-connector"></div>}
              </div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'dossier' ? 'active' : ''}`}
            onClick={() => setActiveTab('dossier')}
          >
            📋 Incident Intelligence & Dispatch
          </button>
          <button 
            className={`modal-tab ${activeTab === 'repair' ? 'active' : ''}`}
            onClick={() => setActiveTab('repair')}
          >
            🔍 Before/After Repair Verification
          </button>
        </div>

        <div className="modal-body-content">
          {activeTab === 'dossier' ? (
            <div className="dossier-grid">
              {/* Left Column: Image & Location */}
              <div className="dossier-col-left">
                <div className="evidence-card">
                  <div className="evidence-header">
                    <span>Citizen Photographic Evidence</span>
                    <span className="ai-confidence-pill">
                      <Sparkles size={12} /> AI Confidence: {Math.round(incident.ai_confidence * 100)}%
                    </span>
                  </div>
                  <div className="evidence-img-container">
                    <img 
                      src={incident.image_url} 
                      alt="Incident Evidence" 
                      className="evidence-img" 
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  </div>
                  <div className="evidence-meta">
                    <div className="meta-row">
                      <MapPin size={15} /> 
                      <span>{incident.location_name || 'Captured via GPS Geolocation'}</span>
                    </div>
                    <div className="meta-coords">
                      GPS: {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Dispatch / Crew Assignment Section */}
                <div className="assignment-box">
                  <h4><Users size={16} /> Municipal Crew Assignment</h4>
                  <form onSubmit={handleAssignSubmit} className="assign-form">
                    <select 
                      value={selectedCrew} 
                      onChange={(e) => setSelectedCrew(e.target.value)}
                      className="crew-select"
                    >
                      {CREW_OPTIONS.map((crew) => (
                        <option key={crew} value={crew}>{crew}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn-assign-crew">
                      <Send size={14} /> Assign & Dispatch
                    </button>
                  </form>
                  {incident.assigned_team && (
                    <div className="active-assigned-alert">
                      Currently assigned to: <strong>{incident.assigned_team}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Risk Engine & Explainability */}
              <div className="dossier-col-right">
                {/* Risk & Priority Score Overview */}
                <div className="ai-scores-card">
                  <div className="score-block">
                    <span className="score-label">SEVERITY ENGINE</span>
                    <div className="score-value">{incident.severity}<span className="denom">/10</span></div>
                    <span className="score-badge crit">
                      {incident.severity >= 8 ? 'CRITICAL STRUCTURAL' : 'ELEVATED'}
                    </span>
                  </div>

                  <div className="score-block highlight-risk">
                    <span className="score-label">RISK ENGINE SCORE</span>
                    <div className="score-value">{incident.risk_score}<span className="denom">/100</span></div>
                    <span className="score-badge risk">
                      {incident.risk_score >= 80 ? 'HIGH COLLATERAL RISK' : 'MODERATE RISK'}
                    </span>
                  </div>

                  <div className="score-block highlight-priority">
                    <span className="score-label">PRIORITY DISPATCH</span>
                    <div className="score-value">{incident.priority_score}<span className="denom">/100</span></div>
                    <span className="score-badge prio">RANK #1 QUEUE</span>
                  </div>
                </div>

                {/* AI Explainability: "WHY THIS MATTERS" */}
                <div className="explainability-box">
                  <div className="explainability-header">
                    <AlertTriangle size={18} className="text-amber" />
                    <h3>AI RISK EXPLAINABILITY: WHY THIS MATTERS</h3>
                  </div>
                  
                  <div className="reasons-list">
                    <div className="reason-item">
                      <div className="reason-icon-dot"></div>
                      <div>
                        <strong>Damage Diagnosis:</strong> {incident.risk_reason || incident.description}
                      </div>
                    </div>

                    <div className="reason-item">
                      <div className="reason-icon-dot"></div>
                      <div>
                        <strong>Traffic & Population Exposure:</strong> {incident.traffic_exposure || 'High volume roadway with heavy pedestrian exposure.'}
                      </div>
                    </div>

                    <div className="reason-item">
                      <div className="reason-icon-dot"></div>
                      <div>
                        <strong>Weather Dynamic Hazard:</strong> {incident.weather_risk || 'Normal atmospheric conditions.'}
                      </div>
                    </div>

                    <div className="reason-item">
                      <div className="reason-icon-dot"></div>
                      <div>
                        <strong>Priority Justification:</strong> {incident.priority_reason || 'Requires immediate barricading and asphalt dispatch.'}
                      </div>
                    </div>
                  </div>

                  <div className="recommended-sla-box">
                    <span className="sla-label">RECOMMENDED MUNICIPAL SLA:</span>
                    <span className="sla-value">{incident.estimated_response_time || 'Respond within 4 Hours'}</span>
                  </div>
                </div>

                {/* Routed Department Card */}
                <div className="dept-route-card">
                  <div className="dept-route-label">INTELLIGENT DEPARTMENT ROUTING</div>
                  <div className="dept-route-name">🏛️ {incident.department}</div>
                  <p className="dept-route-desc">
                    Auto-routed by Natural Language Vision classifier based on municipal jurisdiction protocols.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Repair Verification Tab (Member 4 Differentiator!) */
            <div className="repair-verification-view">
              <div className="verification-banner">
                <ShieldCheck size={24} className="text-emerald" />
                <div>
                  <h4>Before / After Computer Vision Repair Verification</h4>
                  <p>Municipal crew uploads post-repair photo. AI compares surface contours to verify structural resolution.</p>
                </div>
              </div>

              <div className="before-after-grid">
                <div className="comparison-card">
                  <div className="comp-label before">BEFORE REPAIR (Citizen Upload)</div>
                  <img src={incident.image_url} alt="Before Repair" className="comp-image" />
                  <div className="comp-meta">Status: Unrepaired Defect (Severity {incident.severity}/10)</div>
                </div>

                <div className="comparison-card">
                  <div className="comp-label after">AFTER REPAIR (Crew Upload)</div>
                  {repairPhotoPreview ? (
                    <img src={repairPhotoPreview} alt="After Repair" className="comp-image" />
                  ) : (
                    <div className="no-photo-placeholder">
                      <UploadCloud size={40} />
                      <p>No completion photo uploaded yet.</p>
                      <button className="btn-sim-upload" onClick={handleSimulateRepairUpload}>
                        Simulate Crew Photo Upload
                      </button>
                    </div>
                  )}
                  <div className="comp-meta">
                    Status: {incident.repair_verified ? "VERIFIED & RESOLVED" : repairPhotoPreview ? "Ready for AI Inspection" : "Awaiting Crew Photo"}
                  </div>
                </div>
              </div>

              <div className="verification-action-bar">
                {verificationFeedback && (
                  <div className="verification-feedback-alert">
                    {verificationFeedback}
                  </div>
                )}

                <div className="action-buttons-row">
                  {!repairPhotoPreview && (
                    <button className="btn-secondary" onClick={handleSimulateRepairUpload}>
                      📷 Load Completion Photo
                    </button>
                  )}

                  <button 
                    className="btn-primary-verify" 
                    onClick={handleRunAiVerification}
                    disabled={simulatingVerify || !repairPhotoPreview}
                  >
                    {simulatingVerify ? (
                      <>Analyzing Visual Features...</>
                    ) : (
                      <><Sparkles size={16} /> Run AI Repair Verification</>
                    )}
                  </button>

                  <button 
                    className="btn-close-incident" 
                    onClick={() => onUpdateStatus(incident.id, 'CLOSED', incident.assigned_team)}
                  >
                    Close Incident & Archive
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


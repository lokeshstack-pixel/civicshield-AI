import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader.jsx';
import LocationCapture from '../components/LocationCapture.jsx';
import ReportSummary from '../components/ReportSummary.jsx';
import { createIncident, uploadIncidentImage, getIncident } from '../services/api.js';

export default function ReportPage({ onOpenActionModal }) {
  const navigate = useNavigate();

  // Form State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);

  // Validation & Submission State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitStatusMessage, setSubmitStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submittedIncident, setSubmittedIncident] = useState(null);

  const MAX_DESC_LENGTH = 500;

  const issueTypes = [
    'Pothole',
    'Road Damage',
    'Streetlight',
    'Garbage / Waste',
    'Water Leakage',
    'Drainage',
    'Traffic Signal',
    'Broken Footpath',
    'Other',
  ];

  const handleImageSelect = (file, previewUrl) => {
    setImageFile(file);
    setImagePreview(previewUrl);
    if (errors.photo) {
      setErrors((prev) => ({ ...prev, photo: null }));
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const handleLocationCaptured = (coords) => {
    setLocation(coords);
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: null }));
    }
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_DESC_LENGTH) {
      setDescription(val);
      if (errors.description && val.trim().length > 0) {
        setErrors((prev) => ({ ...prev, description: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!imageFile) {
      newErrors.photo = 'Please upload a photo of the issue.';
    }
    if (!description || description.trim().length === 0) {
      newErrors.description = 'Please describe the issue.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide a more descriptive summary (at least 10 characters).';
    }
    if (!location || !location.latitude || !location.longitude) {
      newErrors.location = 'Please capture the incident location using the "USE MY LOCATION" button.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to the first error
      const errorElement = document.querySelector('.field-error-message');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      // Step 1: Create incident in FastAPI backend
      setSubmitStatusMessage('Registering complaint in CIVICSHIELD database...');
      const createdIncident = await createIncident({
        issue_type: issueType ? issueType.toLowerCase() : null,
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      });

      let finalIncidentData = { ...createdIncident };

      // Step 2: Upload photo and run AI triage if photo is attached
      if (imageFile && createdIncident.id) {
        setSubmitStatusMessage('Uploading photo & running AI damage triage...');
        try {
          const uploadRes = await uploadIncidentImage(createdIncident.id, imageFile);

          // Attempt to retrieve the refreshed incident record with AI fields
          try {
            const refreshed = await getIncident(createdIncident.id);
            finalIncidentData = {
              ...refreshed,
              ai_analysis: uploadRes?.ai_analysis,
            };
          } catch (_) {
            finalIncidentData = {
              ...createdIncident,
              image_url: uploadRes?.image_url || null,
              ...(uploadRes?.ai_analysis
                ? {
                    issue_type: uploadRes.ai_analysis.issue_type || createdIncident.issue_type,
                    severity: uploadRes.ai_analysis.severity,
                    risk_score: uploadRes.ai_analysis.risk_score,
                    priority_score: uploadRes.ai_analysis.priority_score,
                    department: uploadRes.ai_analysis.department,
                  }
                : {}),
              ai_analysis: uploadRes?.ai_analysis,
            };
          }
        } catch (imgErr) {
          console.warn('Image upload / AI triage warning:', imgErr);
          setSubmitError(
            `Complaint #${createdIncident.id} was saved, but photo upload encountered an issue: ${imgErr.message}. The complaint is still registered.`
          );
        }
      }

      setSubmittedIncident(finalIncidentData);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(
        err.message || 'Failed to submit complaint. Please ensure the backend is running and try again.'
      );
    } finally {
      setIsSubmitting(false);
      setSubmitStatusMessage('');
    }
  };

  const handleReset = () => {
    handleImageRemove();
    setIssueType('');
    setDescription('');
    setLocation(null);
    setErrors({});
    setSubmitError('');
    setSubmitStatusMessage('');
    setSubmittedIncident(null);
    setIsSubmitted(false);
  };

  return (
    <div className="report-page-root">
      <div className="container report-page-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            <li>
              <Link to="/" className="breadcrumb-link">
                Home
              </Link>
            </li>
            <li className="breadcrumb-separator" aria-hidden="true">/</li>
            <li className="breadcrumb-current" aria-current="page">
              Report an Issue
            </li>
          </ol>
        </nav>

        {/* Success View */}
        {isSubmitted ? (
          <div className="submission-success-card" role="region" aria-live="polite">
            <div className="success-icon-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="success-stage-tag">
              COMPLAINT REGISTERED · ID #{submittedIncident?.id || '—'}
            </span>
            <h1 className="success-title">Complaint Successfully Submitted</h1>
            <p className="success-subtitle">
              Your report has been received and processed by CIVICSHIELD AI. Reference ID #{submittedIncident?.id}.
            </p>

            {submitError && (
              <div className="form-validation-banner form-error-banner" style={{ marginBottom: 20 }}>
                <div className="banner-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>{submitError}</div>
              </div>
            )}

            {/* AI Assessment Card (if AI triage returned scores) */}
            {(submittedIncident?.priority_score > 0 || submittedIncident?.ai_analysis) && (
              <div className="ai-assessment-card" style={{
                width: '100%',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                border: '1px solid #93c5fd',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: '#1d4ed8' }}>
                    CIVICSHIELD AI ASSESSMENT COMPLETE
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: submittedIncident?.priority_score >= 70 ? '#fee2e2' : '#fef3c7',
                    color: submittedIncident?.priority_score >= 70 ? '#991b1b' : '#92400e'
                  }}>
                    {submittedIncident?.ai_analysis?.priority_level || (submittedIncident?.priority_score >= 70 ? 'HIGH PRIORITY' : 'MODERATE PRIORITY')}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>SEVERITY</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {submittedIncident?.severity ?? 0}<span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/100</span>
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>RISK SCORE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {submittedIncident?.risk_score ?? 0}<span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/100</span>
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PRIORITY SCORE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                      {submittedIncident?.priority_score ?? 0}<span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/100</span>
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>DEPARTMENT</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {submittedIncident?.department || 'Assigned automatically'}
                    </div>
                  </div>
                </div>
                {submittedIncident?.ai_analysis?.damage_description && (
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', fontStyle: 'italic' }}>
                    "{submittedIncident.ai_analysis.damage_description}"
                  </p>
                )}
              </div>
            )}

            {/* Collected Payload Summary */}
            <div className="collected-data-card">
              <h3 className="collected-data-heading">Registered Complaint Details</h3>
              <div className="collected-grid">
                <div className="collected-field">
                  <span className="collected-label">Incident Reference:</span>
                  <span className="collected-value">#{submittedIncident?.id || '—'}</span>
                </div>

                <div className="collected-field">
                  <span className="collected-label">Current Status:</span>
                  <span className="collected-value" style={{ color: '#0284c7', fontWeight: 700 }}>
                    {submittedIncident?.status || 'REPORTED'}
                  </span>
                </div>

                <div className="collected-field">
                  <span className="collected-label">Uploaded Photo:</span>
                  <div className="collected-photo-preview">
                    {(submittedIncident?.image_url || imagePreview) && (
                      <img
                        src={submittedIncident?.image_url || imagePreview}
                        alt="Submitted issue preview"
                        className="collected-thumb"
                      />
                    )}
                    <span className="collected-value">
                      {imageFile?.name || 'Evidence photo attached'}
                    </span>
                  </div>
                </div>

                <div className="collected-field">
                  <span className="collected-label">Issue Classification:</span>
                  <span className="collected-value">
                    {submittedIncident?.issue_type || issueType || 'Other'}
                  </span>
                </div>

                <div className="collected-field full-width">
                  <span className="collected-label">Description:</span>
                  <p className="collected-desc-text">"{submittedIncident?.description || description}"</p>
                </div>

                <div className="collected-field full-width">
                  <span className="collected-label">Geo Coordinates:</span>
                  <div className="collected-coords-tag">
                    <span>Latitude: {submittedIncident?.latitude ?? location?.latitude}° N</span>
                    <span className="coord-split">•</span>
                    <span>Longitude: {submittedIncident?.longitude ?? location?.longitude}° E</span>
                    {location?.accuracyMeters && (
                      <>
                        <span className="coord-split">•</span>
                        <span>Accuracy: ~{location.accuracyMeters}m</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="success-actions-row">
              {onOpenActionModal && (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => onOpenActionModal('track', submittedIncident?.id)}
                >
                  TRACK THIS COMPLAINT
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline btn-lg"
                onClick={handleReset}
              >
                SUBMIT ANOTHER REPORT
              </button>
              <Link to="/" className="btn btn-ghost btn-lg" style={{ border: '1px solid var(--border-subtle)' }}>
                BACK TO HOME
              </Link>
            </div>
          </div>
        ) : (
          /* Main Two-Column Reporting Form */
          <>
            <header className="report-header">
              <h1 className="report-title">Report an Infrastructure Issue</h1>
              <p className="report-subtitle">
                Help your city identify and prioritize problems faster. Upload a photo, describe the issue, and share its location.
              </p>
            </header>

            {/* API Error Banner if submission failed */}
            {submitError && (
              <div className="form-validation-banner form-error-banner" role="alert" style={{ marginBottom: 20 }}>
                <div className="banner-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <strong>Submission Error:</strong>
                  <p style={{ margin: '4px 0 0' }}>{submitError}</p>
                </div>
              </div>
            )}

            {/* Validation Banner if submitted with errors */}
            {Object.keys(errors).length > 0 && (
              <div className="form-validation-banner" role="alert">
                <div className="banner-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <strong>Please complete the required fields:</strong>
                  <ul className="banner-errors-list">
                    {errors.photo && <li>{errors.photo}</li>}
                    {errors.description && <li>{errors.description}</li>}
                    {errors.location && <li>{errors.location}</li>}
                  </ul>
                </div>
              </div>
            )}

            <div className="report-layout-grid">
              {/* Left Column: Input Form */}
              <div className="report-form-column">
                <form onSubmit={handleSubmit} noValidate className="report-form-card">
                  {/* Section 1: Photo Upload */}
                  <ImageUploader
                    imageFile={imageFile}
                    imagePreview={imagePreview}
                    onImageSelect={handleImageSelect}
                    onImageRemove={handleImageRemove}
                    error={errors.photo}
                  />

                  <hr className="form-section-divider" aria-hidden="true" />

                  {/* Section 2: Issue Type */}
                  <div className="form-field-group">
                    <div className="field-header">
                      <label htmlFor="issue-type-select" className="field-label">
                        Issue Type <span className="optional-tag">(Optional)</span>
                      </label>
                      <span className="field-hint">Helps manual filtering</span>
                    </div>
                    <p className="field-subtext">Select the category that best matches what you observed.</p>
                    <div className="select-wrapper">
                      <select
                        id="issue-type-select"
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="form-select"
                      >
                        <option value="">Select an issue type</option>
                        {issueTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <span className="select-arrow" aria-hidden="true">▼</span>
                    </div>
                  </div>

                  <hr className="form-section-divider" aria-hidden="true" />

                  {/* Section 3: Description */}
                  <div className="form-field-group">
                    <div className="field-header">
                      <label htmlFor="issue-description" className="field-label">
                        Describe the Issue <span className="required-indicator" aria-label="Required">*</span>
                      </label>
                      <span className={`char-counter ${description.length >= MAX_DESC_LENGTH ? 'counter-limit' : ''}`}>
                        {description.length} / {MAX_DESC_LENGTH} characters
                      </span>
                    </div>
                    <p className="field-subtext">
                      Tell us what happened, where it is, and anything that may help authorities understand the problem...
                    </p>
                    <textarea
                      id="issue-description"
                      value={description}
                      onChange={handleDescriptionChange}
                      placeholder="Tell us what happened, where it is, and anything that may help authorities understand the problem..."
                      rows={4}
                      className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                      aria-invalid={errors.description ? 'true' : 'false'}
                    />
                    {errors.description && (
                      <p className="field-error-message" role="alert">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <hr className="form-section-divider" aria-hidden="true" />

                  {/* Section 4: Location */}
                  <LocationCapture
                    location={location}
                    onLocationCaptured={handleLocationCaptured}
                    error={errors.location}
                  />

                  <hr className="form-section-divider" aria-hidden="true" />

                  {/* Submit Area */}
                  <div className="form-submit-footer">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-lg submit-complaint-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="btn-spinner" aria-hidden="true"></span>
                          Submitting your report...
                        </>
                      ) : (
                        'SUBMIT COMPLAINT'
                      )}
                    </button>
                    <p className="submit-disclaimer">
                      Complaints are prioritized based on municipal infrastructure safety standards.
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Summary & Guidance */}
              <div className="report-sidebar-column">
                <ReportSummary
                  imageFile={imageFile}
                  imagePreview={imagePreview}
                  issueType={issueType}
                  description={description}
                  location={location}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


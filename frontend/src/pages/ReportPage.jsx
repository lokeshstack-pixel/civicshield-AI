import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader.jsx';
import LocationCapture from '../components/LocationCapture.jsx';
import ReportSummary from '../components/ReportSummary.jsx';

export default function ReportPage() {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to the first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector('.field-error-message');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Simulate frontend-only submission delay (no backend API calls)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const handleReset = () => {
    handleImageRemove();
    setIssueType('');
    setDescription('');
    setLocation(null);
    setErrors({});
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
            <span className="success-stage-tag">FRONTEND VERIFICATION COMPLETE</span>
            <h1 className="success-title">Report ready for submission</h1>
            <p className="success-subtitle">
              Your complaint information has been collected successfully.
            </p>

            {/* Collected Payload Summary */}
            <div className="collected-data-card">
              <h3 className="collected-data-heading">Collected Complaint Data</h3>
              <div className="collected-grid">
                <div className="collected-field">
                  <span className="collected-label">Uploaded Photo:</span>
                  <div className="collected-photo-preview">
                    {imagePreview && (
                      <img src={imagePreview} alt="Submitted issue preview" className="collected-thumb" />
                    )}
                    <span className="collected-value">{imageFile?.name}</span>
                  </div>
                </div>

                <div className="collected-field">
                  <span className="collected-label">Issue Type:</span>
                  <span className="collected-value">{issueType || 'Not specified (AI will classify)'}</span>
                </div>

                <div className="collected-field full-width">
                  <span className="collected-label">Description:</span>
                  <p className="collected-desc-text">"{description}"</p>
                </div>

                <div className="collected-field full-width">
                  <span className="collected-label">Geo Location:</span>
                  <div className="collected-coords-tag">
                    <span>Latitude: {location?.latitude}° N</span>
                    <span className="coord-split">•</span>
                    <span>Longitude: {location?.longitude}° E</span>
                    <span className="coord-split">•</span>
                    <span>Accuracy: ~{location?.accuracyMeters}m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="submission-roadmap-notice">
              <div className="roadmap-notice-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p className="roadmap-notice-text">
                <strong>Project Status:</strong> This step collects and validates the citizen reporting payload entirely on the client side. In the next development step, this payload will be connected to the FastAPI backend triage engine.
              </p>
            </div>

            <div className="success-actions-row">
              <Link to="/" className="btn btn-primary btn-lg">
                BACK TO HOME
              </Link>
              <button
                type="button"
                className="btn btn-outline btn-lg"
                onClick={handleReset}
              >
                SUBMIT ANOTHER REPORT
              </button>
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


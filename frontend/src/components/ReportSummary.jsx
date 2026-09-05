import React from 'react';

export default function ReportSummary({
  imageFile,
  imagePreview,
  issueType,
  description,
  location,
}) {
  const isPhotoReady = Boolean(imageFile);
  const isTypeSelected = Boolean(issueType);
  const isDescriptionReady = Boolean(description && description.trim().length > 0);
  const isLocationReady = Boolean(location && location.latitude);

  return (
    <aside className="report-summary-sidebar" aria-label="Live Report Summary">
      <div className="summary-card">
        <div className="summary-card-header">
          <div className="summary-title-row">
            <svg className="summary-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h3 className="summary-title">Report Summary</h3>
          </div>
          <span className="summary-badge">LIVE REVIEW</span>
        </div>

        <div className="summary-items-list">
          {/* Item 1: Photo */}
          <div className="summary-item">
            <div className="summary-item-header">
              <span className="summary-item-name">PHOTO</span>
              <span className={`summary-status-pill ${isPhotoReady ? 'status-ready' : 'status-pending'}`}>
                {isPhotoReady ? 'Selected' : 'Not added'}
              </span>
            </div>
            {isPhotoReady ? (
              <div className="summary-preview-thumb">
                <img src={imagePreview} alt="Thumbnail preview" className="summary-thumb-img" />
                <div className="summary-thumb-meta">
                  <span className="summary-thumb-name">{imageFile.name}</span>
                  <span className="summary-thumb-sub">Photo verified for upload</span>
                </div>
              </div>
            ) : (
              <p className="summary-item-empty">Requires 1 clear infrastructure photograph.</p>
            )}
          </div>

          {/* Item 2: Issue Type */}
          <div className="summary-item">
            <div className="summary-item-header">
              <span className="summary-item-name">ISSUE TYPE</span>
              <span className={`summary-status-pill ${isTypeSelected ? 'status-ready' : 'status-optional'}`}>
                {isTypeSelected ? issueType : 'Not selected'}
              </span>
            </div>
            <p className="summary-item-sub">
              {isTypeSelected
                ? `Category tagged as ${issueType}`
                : 'Optional. AI will assist with classification if unspecified.'}
            </p>
          </div>

          {/* Item 3: Description */}
          <div className="summary-item">
            <div className="summary-item-header">
              <span className="summary-item-name">DESCRIPTION</span>
              <span className={`summary-status-pill ${isDescriptionReady ? 'status-ready' : 'status-pending'}`}>
                {isDescriptionReady ? 'Added' : 'Not added'}
              </span>
            </div>
            {isDescriptionReady ? (
              <p className="summary-text-preview">"{description.slice(0, 110)}{description.length > 110 ? '...' : ''}"</p>
            ) : (
              <p className="summary-item-empty">Provide context regarding physical defect or obstruction.</p>
            )}
          </div>

          {/* Item 4: Location */}
          <div className="summary-item">
            <div className="summary-item-header">
              <span className="summary-item-name">LOCATION</span>
              <span className={`summary-status-pill ${isLocationReady ? 'status-ready' : 'status-pending'}`}>
                {isLocationReady ? 'Captured' : 'Not captured'}
              </span>
            </div>
            {isLocationReady ? (
              <div className="summary-coords-inline">
                <span className="coords-mini">
                  {location.latitude}°, {location.longitude}°
                </span>
                <span className="coords-acc">GPS verified</span>
              </div>
            ) : (
              <p className="summary-item-empty">GPS coordinate required for municipal dispatch.</p>
            )}
          </div>
        </div>
      </div>

      {/* Public Service Guidance Card */}
      <div className="guidance-card">
        <div className="guidance-header">
          <svg className="guidance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <h4 className="guidance-title">Reporting Best Practices</h4>
        </div>
        <ul className="guidance-list">
          <li>Take photos from a safe vantage point away from moving traffic.</li>
          <li>Frame both the problem (e.g. pothole) and surrounding landmark context.</li>
          <li>Turn on mobile location/GPS for exact street-level accuracy.</li>
          <li>Reports are prioritized algorithmically according to public safety risk.</li>
        </ul>
      </div>
    </aside>
  );
}


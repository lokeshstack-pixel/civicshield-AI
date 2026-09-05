import React, { useState } from 'react';

export default function LocationCapture({ location, onLocationCaptured, error }) {
  const [status, setStatus] = useState(location ? 'SUCCESS' : 'INITIAL'); // INITIAL | LOADING | SUCCESS | ERROR
  const [errorMessage, setErrorMessage] = useState('');

  const requestGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setStatus('ERROR');
      setErrorMessage('Geolocation is not supported by your browser. Please use a modern browser.');
      return;
    }

    setStatus('LOADING');
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracyMeters: Math.round(position.coords.accuracy),
          timestamp: new Date().toISOString(),
        };
        setStatus('SUCCESS');
        onLocationCaptured(coords);
      },
      (geoError) => {
        setStatus('ERROR');
        let humanMessage = 'Unable to access your location. Please allow location permission and try again.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          humanMessage = 'Location permission was denied. Please allow location access in your browser settings and try again.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          humanMessage = 'Location signal is unavailable. Please check your network or GPS connection.';
        } else if (geoError.code === geoError.TIMEOUT) {
          humanMessage = 'Location detection timed out. Please try again.';
        }
        setErrorMessage(humanMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="form-field-group">
      <div className="field-header">
        <label className="field-label">
          Incident Location <span className="required-indicator" aria-label="Required">*</span>
        </label>
        <span className="field-hint">High precision GPS</span>
      </div>
      <p className="field-subtext">
        Your location helps authorities identify and respond to the issue.
      </p>

      <div className={`location-panel ${status === 'SUCCESS' ? 'location-panel-success' : ''} ${status === 'ERROR' || error ? 'location-panel-error' : ''}`}>
        {/* Status: INITIAL */}
        {status === 'INITIAL' && (
          <div className="location-state-initial">
            <div className="location-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="location-text-col">
              <span className="location-status-title">Location not captured</span>
              <span className="location-status-desc">Allow browser access to pin the exact municipal coordinate.</span>
            </div>
            <button
              type="button"
              className="btn btn-primary location-action-btn"
              onClick={requestGeolocation}
            >
              USE MY LOCATION
            </button>
          </div>
        )}

        {/* Status: LOADING */}
        {status === 'LOADING' && (
          <div className="location-state-loading" role="status" aria-live="polite">
            <div className="location-spinner" aria-hidden="true"></div>
            <div className="location-text-col">
              <span className="location-status-title">Detecting your location...</span>
              <span className="location-status-desc">Acquiring accurate GPS satellite coordinates</span>
            </div>
          </div>
        )}

        {/* Status: SUCCESS */}
        {status === 'SUCCESS' && location && (
          <div className="location-state-success">
            <div className="location-success-header">
              <div className="location-success-title-wrap">
                <span className="check-badge-icon" aria-hidden="true">✓</span>
                <div>
                  <span className="location-success-badge">Location captured</span>
                  <p className="location-accuracy-note">Accuracy: ~{location.accuracyMeters || 12}m</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={requestGeolocation}
                title="Update your location"
              >
                Update
              </button>
            </div>

            <div className="coords-display-grid">
              <div className="coord-box">
                <span className="coord-label">Latitude:</span>
                <span className="coord-value">{location.latitude}° N</span>
              </div>
              <div className="coord-box">
                <span className="coord-label">Longitude:</span>
                <span className="coord-value">{location.longitude}° E</span>
              </div>
            </div>
          </div>
        )}

        {/* Status: ERROR */}
        {status === 'ERROR' && (
          <div className="location-state-error">
            <div className="location-error-left">
              <div className="error-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <span className="location-error-title">Location access was unsuccessful</span>
                <p className="location-error-desc">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm error-retry-btn"
              onClick={requestGeolocation}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {error && !errorMessage && (
        <p className="field-error-message" role="alert">{error}</p>
      )}
    </div>
  );
}


import React, { useRef, useState } from 'react';

export default function ImageUploader({ imageFile, imagePreview, onImageSelect, onImageRemove, error }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE_MB = 10;
  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateAndProcessFile = (file) => {
    setUploadError('');
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`Image is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onImageSelect(file, previewUrl);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="form-field-group">
      <div className="field-header">
        <label className="field-label" htmlFor="image-file-input">
          Upload a Photo <span className="required-indicator" aria-label="Required">*</span>
        </label>
        <span className="field-hint">JPG, PNG, or WEBP up to 10MB</span>
      </div>
      <p className="field-subtext">Add a clear photo of the infrastructure problem.</p>

      {/* Upload Box / Preview Box */}
      {!imagePreview ? (
        <div
          className={`dropzone-box ${isDragOver ? 'dropzone-active' : ''} ${error || uploadError ? 'dropzone-error' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload photo of the infrastructure issue. Drag and drop or press enter to browse."
        >
          <input
            id="image-file-input"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className="dropzone-content">
            <div className="dropzone-icon-circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="dropzone-main-text">
              <span className="dropzone-bold">Drag & drop your image here</span>, or{' '}
              <span className="dropzone-action">click to browse</span>
            </p>
            <p className="dropzone-muted-text">Clear photos showing road/site context yield faster verification</p>
          </div>
        </div>
      ) : (
        <div className="preview-container">
          <div className="preview-media-frame">
            <img
              src={imagePreview}
              alt="Infrastructure problem preview"
              className="preview-img"
            />
            <div className="preview-badge-status">
              <span className="preview-status-dot"></span> Photo Loaded
            </div>
          </div>

          <div className="preview-meta-row">
            <div className="preview-info">
              <span className="preview-filename" title={imageFile?.name}>
                {imageFile?.name}
              </span>
              <span className="preview-size">{formatFileSize(imageFile?.size)}</span>
            </div>

            <div className="preview-actions">
              <button
                type="button"
                className="btn-link btn-replace"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </button>
              <button
                type="button"
                className="btn-link btn-remove"
                onClick={onImageRemove}
              >
                Remove
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      )}

      {(uploadError || error) && (
        <p className="field-error-message" role="alert">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}


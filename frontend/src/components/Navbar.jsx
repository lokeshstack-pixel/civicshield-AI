import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ onOpenActionModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleHowItWorksClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleReportClick = () => {
    setMobileMenuOpen(false);
    navigate('/report');
  };

  return (
    <header className="site-header">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={handleHomeClick}>
          <div className="shield-icon-wrapper" aria-hidden="true">
            <svg
              className="shield-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className="brand-name">
            CIVICSHIELD <span className="ai-badge">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            <li>
              <Link to="/" className="nav-link" onClick={handleHomeClick}>
                Home
              </Link>
            </li>
            <li>
              <a href="#how-it-works" className="nav-link" onClick={handleHowItWorksClick}>
                How It Works
              </a>
            </li>
            <li>
              <button
                type="button"
                className="nav-link-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenActionModal('track');
                }}
              >
                Track Complaint
              </button>
            </li>
          </ul>
          <button
            type="button"
            className="btn btn-primary nav-cta-btn"
            onClick={handleReportClick}
          >
            REPORT AN ISSUE
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="Mobile Navigation Menu">
          <ul className="mobile-nav-list">
            <li>
              <Link to="/" className="mobile-nav-link" onClick={handleHomeClick}>
                Home
              </Link>
            </li>
            <li>
              <a href="#how-it-works" className="mobile-nav-link" onClick={handleHowItWorksClick}>
                How It Works
              </a>
            </li>
            <li>
              <button
                type="button"
                className="mobile-nav-link-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenActionModal('track');
                }}
              >
                Track Complaint
              </button>
            </li>
            <li className="mobile-cta-item">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={handleReportClick}
              >
                REPORT AN ISSUE
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

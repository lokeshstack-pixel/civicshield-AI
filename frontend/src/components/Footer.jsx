import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Footer({ onOpenActionModal }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHowItWorksClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById('how-it-works');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-top">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="footer-shield-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span className="footer-brand-name">
                CIVICSHIELD <span className="ai-badge">AI</span>
              </span>
            </Link>
            <p className="footer-tagline">
              Intelligent infrastructure. Faster civic action.
            </p>
            <p className="footer-mission-note">
              Built for smarter, safer cities.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Platform Navigation</h4>
            <ul className="footer-nav-list">
              <li>
                <Link to="/report" className="footer-link">
                  Report an Issue
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onOpenActionModal('track')}
                >
                  Track Complaint
                </button>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="footer-link"
                  onClick={handleHowItWorksClick}
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <p className="footer-copyright">
              © {new Date().getFullYear()} CIVICSHIELD AI. Public Infrastructure Intelligence Framework.
            </p>
            <span className="footer-stage-badge">
              Step 3 / Citizen Reporting Prototype
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

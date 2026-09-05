import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, BarChart3, Layers, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';

export default function Header({ activeView, setActiveView, onRefresh, lastUpdated, incidentCount }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="command-header">
      <div className="header-brand-section">
        <div className="brand-logo-shield">
          <ShieldAlert className="shield-icon" size={28} />
          <span className="pulse-indicator"></span>
        </div>
        <div className="brand-titles">
          <div className="brand-name-row">
            <h1>CIVICSHIELD AI</h1>
            <span className="badge-system-live">
              <Radio size={12} className="animate-pulse" /> LIVE MUNICIPAL DISPATCH
            </span>
          </div>
          <p className="brand-subtitle">AI-Powered Predictive Urban Infrastructure Risk & Response Platform</p>
        </div>
      </div>

      <div className="header-center-tabs">
        <button 
          className={`nav-tab-btn ${activeView === 'split' ? 'active' : ''}`}
          onClick={() => setActiveView('split')}
        >
          <Layers size={16} /> Split Command
        </button>
        <button 
          className={`nav-tab-btn ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => setActiveView('map')}
        >
          <MapPin size={16} /> GIS Map Focus
        </button>
        <button 
          className={`nav-tab-btn ${activeView === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveView('queue')}
        >
          <ShieldAlert size={16} /> Priority Queue ({incidentCount})
        </button>
        <button 
          className={`nav-tab-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          <BarChart3 size={16} /> Analytics & SDGs
        </button>
      </div>

      <div className="header-status-section">
        <div className="live-clock-badge">
          <span className="clock-time">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span className="clock-date">{currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <button 
          className="refresh-btn" 
          onClick={onRefresh} 
          title="Refresh Data & Sync with Backend"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  );
}


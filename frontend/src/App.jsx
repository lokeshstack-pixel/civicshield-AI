import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ActionInfoModal from './components/ActionInfoModal.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import './App.css';

function AppContent() {
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'report' });
  const navigate = useNavigate();

  const handleOpenActionModal = (type) => {
    setModalConfig({ isOpen: true, type });
  };

  const handleCloseActionModal = () => {
    setModalConfig({ isOpen: false, type: 'report' });
  };

  const handleReportClick = () => {
    navigate('/report');
  };

  return (
    <div className="civicshield-app">
      <ScrollToTop />

      {/* Navigation */}
      <Navbar onOpenActionModal={handleOpenActionModal} />

      {/* Page Routing */}
      <main id="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                onOpenActionModal={handleOpenActionModal}
                onReportClick={handleReportClick}
              />
            }
          />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer onOpenActionModal={handleOpenActionModal} />

      {/* Action Notification Modal (for Track Complaint preview) */}
      <ActionInfoModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        onClose={handleCloseActionModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

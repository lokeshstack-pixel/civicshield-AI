import React from 'react';
import Hero from '../components/Hero.jsx';
import ValueStrip from '../components/ValueStrip.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import CivicImpact from '../components/CivicImpact.jsx';
import FeatureCards from '../components/FeatureCards.jsx';
import CtaSection from '../components/CtaSection.jsx';

export default function LandingPage({ onOpenActionModal, onReportClick }) {
  return (
    <div className="landing-page-root">
      <Hero onOpenActionModal={onOpenActionModal} onReportClick={onReportClick} />
      <ValueStrip />
      <HowItWorks />
      <CivicImpact />
      <FeatureCards />
      <CtaSection onOpenActionModal={onOpenActionModal} onReportClick={onReportClick} />
    </div>
  );
}


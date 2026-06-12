import React from 'react';
import './DisclaimerBanner.css';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  return (
    <div className={`disclaimer-banner ${compact ? 'disclaimer-banner--compact' : ''}`} role="alert">
      <span className="disclaimer-banner__icon">ℹ️</span>
      <p className="disclaimer-banner__text">
        {compact
          ? 'App privata di formazione interna. Non promuove il consumo di tabacco.'
          : 'Questa applicazione è destinata esclusivamente a formazione interna di operatori adulti del settore. Non promuove né incentiva il consumo di tabacco.'}
      </p>
    </div>
  );
};

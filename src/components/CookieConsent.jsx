import { useState } from 'react';
import { getStoredConsent, setStoredConsent, initializeGA4 } from '../utils/consent';
import { translations } from '../utils/lang';

export default function CookieConsent({ lang }) {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = getStoredConsent();
    return !stored;
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    functional: false,
    marketing: false
  });

  const t = translations[lang] || translations.en;

  const handleAcceptAll = () => {
    const allTrue = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true
    };
    setStoredConsent(allTrue);
    initializeGA4();
    setIsOpen(false);
  };

  const handleDeclineAll = () => {
    const declined = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false
    };
    setStoredConsent(declined);
    setIsOpen(false);
  };

  const handleSavePreferences = () => {
    setStoredConsent(preferences);
    if (preferences.analytics) {
      initializeGA4();
    }
    setIsOpen(false);
  };

  const handleToggle = (key) => {
    if (key === 'necessary') return; // Read-only / Locked
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  const isRtl = lang === 'he';

  return (
    <div className={`cookie-banner ${isRtl ? 'rtl' : 'ltr'}`} role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      {!showPreferences ? (
        <div className="cookie-banner-content">
          <p className="cookie-banner-text">{t.cookieMessage}</p>
          <div className="cookie-banner-actions">
            <button onClick={handleAcceptAll} className="btn-cookie btn-cookie-primary">
              {t.cookieAcceptAll}
            </button>
            <button onClick={handleDeclineAll} className="btn-cookie btn-cookie-secondary">
              {t.cookieDeclineAll}
            </button>
            <button onClick={() => setShowPreferences(true)} className="btn-cookie btn-cookie-link">
              {t.cookieCustomize}
            </button>
          </div>
        </div>
      ) : (
        <div className="cookie-preferences-container">
          <h3 id="cookie-title" className="cookie-preferences-title">{t.cookieTitle}</h3>
          
          <div className="cookie-preference-list">
            {/* Necessary */}
            <div className="cookie-preference-item">
              <div className="cookie-preference-info">
                <span className="cookie-preference-label">{t.cookieNecessaryTitle}</span>
                <span className="cookie-preference-desc">{t.cookieNecessaryDesc}</span>
              </div>
              <button 
                className="cookie-switch active disabled" 
                aria-disabled="true"
                aria-label={t.cookieNecessaryTitle}
              >
                <span className="cookie-switch-slider"></span>
              </button>
            </div>

            {/* Analytics */}
            <div className="cookie-preference-item">
              <div className="cookie-preference-info">
                <span className="cookie-preference-label">{t.cookieAnalyticsTitle}</span>
                <span className="cookie-preference-desc">{t.cookieAnalyticsDesc}</span>
              </div>
              <button 
                className={`cookie-switch ${preferences.analytics ? 'active' : ''}`}
                onClick={() => handleToggle('analytics')}
                aria-label={t.cookieAnalyticsTitle}
                aria-checked={preferences.analytics}
                role="switch"
              >
                <span className="cookie-switch-slider"></span>
              </button>
            </div>

            {/* Functional */}
            <div className="cookie-preference-item">
              <div className="cookie-preference-info">
                <span className="cookie-preference-label">{t.cookieFunctionalTitle}</span>
                <span className="cookie-preference-desc">{t.cookieFunctionalDesc}</span>
              </div>
              <button 
                className={`cookie-switch ${preferences.functional ? 'active' : ''}`}
                onClick={() => handleToggle('functional')}
                aria-label={t.cookieFunctionalTitle}
                aria-checked={preferences.functional}
                role="switch"
              >
                <span className="cookie-switch-slider"></span>
              </button>
            </div>

            {/* Marketing */}
            <div className="cookie-preference-item">
              <div className="cookie-preference-info">
                <span className="cookie-preference-label">{t.cookieMarketingTitle}</span>
                <span className="cookie-preference-desc">{t.cookieMarketingDesc}</span>
              </div>
              <button 
                className={`cookie-switch ${preferences.marketing ? 'active' : ''}`}
                onClick={() => handleToggle('marketing')}
                aria-label={t.cookieMarketingTitle}
                aria-checked={preferences.marketing}
                role="switch"
              >
                <span className="cookie-switch-slider"></span>
              </button>
            </div>
          </div>

          <div className="cookie-preferences-actions">
            <button onClick={handleSavePreferences} className="btn-cookie btn-cookie-primary">
              {t.cookieSave}
            </button>
            <button onClick={handleAcceptAll} className="btn-cookie btn-cookie-secondary">
              {t.cookieAcceptAll}
            </button>
            <a 
              href="#guide" 
              className="cookie-privacy-link"
              onClick={(e) => {
                e.preventDefault();
                alert(lang === 'he' ? 'מדיניות הפרטיות מפורטת במדריך האתר.' : 'Privacy policy details are available in the site guide.');
              }}
            >
              {t.cookiePrivacyLink}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { translations } from '../utils/lang.js';
import { trackEvent } from '../utils/analytics.js';
import {
  detectInstallPlatform,
  isStandalonePWA,
  trackOncePerSession,
} from '../utils/pwaInstall.js';

export default function FooterInstallCTA({ lang }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const standalone = isStandalonePWA();
  const platform = useMemo(() => detectInstallPlatform(), []);
  const t = translations[lang];

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (standalone) {
      trackOncePerSession('ozora_pwa_open_standalone_tracked', () => {
        trackEvent('pwa_open_standalone', { platform });
      });
      return;
    }

    if (platform === 'desktop') return;

    trackOncePerSession('ozora_footer_install_cta_view_tracked', () => {
      trackEvent('pwa_install_cta_view', {
        source: 'footer',
        platform,
      });
    });
  }, [platform, standalone]);

  if (standalone || platform === 'desktop') return null;

  const handleInstallClick = async () => {
    const promptAvailable = Boolean(deferredPrompt);

    trackEvent('pwa_install_cta_click', {
      source: 'footer',
      platform,
      prompt_available: promptAvailable,
    });

    if (!deferredPrompt) {
      setShowFallback(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      trackEvent('pwa_install_result', {
        source: 'footer',
        platform,
        outcome: choice?.outcome || 'unknown',
      });
      setDeferredPrompt(null);
    } catch {
      setShowFallback(true);
    }
  };

  return (
    <div className="footer-install-cta mobile-view-only">
      <span className="footer-install-copy">{t.footerInstallPrompt}</span>
      <button className="footer-install-btn" type="button" onClick={handleInstallClick}>
        <Download size={16} aria-hidden="true" />
        <span>{t.footerInstallBtn}</span>
      </button>
      {showFallback && (
        <p className="footer-install-help">{t.footerInstallHelp}</p>
      )}
    </div>
  );
}

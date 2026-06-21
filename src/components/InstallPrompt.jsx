import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { translations } from '../utils/lang';
import { trackEvent } from '../utils/analytics';

export default function InstallPrompt({ lang }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('ozora_install_dismissed') === 'true';
  });

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (deferredPrompt && !dismissed) {
      trackEvent('pwa_install', { action: 'prompt_shown' });
    }
  }, [deferredPrompt, dismissed]);

  if (!deferredPrompt || dismissed) return null;

  const t = translations[lang];

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    trackEvent('pwa_install', { action: outcome });
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('ozora_install_dismissed', 'true');
    trackEvent('pwa_install', { action: 'dismissed_banner' });
  };

  return (
    <div className="install-prompt-banner">
      <Download size={18} />
      <span>{t.installPrompt}</span>
      <button className="install-prompt-btn" onClick={handleInstall}>
        {t.installBtn}
      </button>
      <button className="install-prompt-dismiss" onClick={handleDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

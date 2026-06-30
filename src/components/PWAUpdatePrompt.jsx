import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { translations } from '../utils/lang';

const SKIP_KEY = 'ozora_pwa_update_skipped';

const getInitialSkipped = () => {
  try {
    return sessionStorage.getItem(SKIP_KEY) === 'true';
  } catch {
    return false;
  }
};

export default function PWAUpdatePrompt({ lang }) {
  const [skipped, setSkipped] = useState(getInitialSkipped);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError() {
      // Keep the current cached app usable if registration fails.
    },
  });

  useEffect(() => {
    if (!needRefresh) {
      setSkipped(false);
    }
  }, [needRefresh]);

  if (!needRefresh || skipped) return null;

  const t = translations[lang];

  const handleSkip = () => {
    setSkipped(true);
    try {
      sessionStorage.setItem(SKIP_KEY, 'true');
    } catch {
      // Component state still suppresses the prompt for this render tree.
    }
  };

  const handleUpdate = () => {
    void updateServiceWorker(true).catch(() => {});
  };

  return (
    <div className="pwa-update-banner" role="status" aria-live="polite">
      <RefreshCw size={18} className="pwa-update-icon" aria-hidden="true" />
      <div className="pwa-update-copy">
        <strong>{t.pwaUpdateTitle}</strong>
        <span>{t.pwaUpdateBody}</span>
      </div>
      <div className="pwa-update-actions">
        <button className="pwa-update-primary" type="button" onClick={handleUpdate}>
          {t.pwaUpdateNow}
        </button>
        <button className="pwa-update-skip" type="button" onClick={handleSkip}>
          {t.pwaUpdateSkip}
        </button>
      </div>
      <button className="pwa-update-dismiss" type="button" onClick={handleSkip} aria-label={t.pwaUpdateDismiss}>
        <X size={16} />
      </button>
    </div>
  );
}

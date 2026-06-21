export const detectInstallPlatform = (navigatorLike = undefined) => {
  if (typeof window === 'undefined' && !navigatorLike) return 'unknown';

  const nav = navigatorLike || window.navigator || {};
  const userAgent = nav.userAgent || '';
  const maxTouchPoints = nav.maxTouchPoints || 0;

  if (/android/i.test(userAgent)) return 'android';

  const isiOSDevice = /iphone|ipad|ipod/i.test(userAgent);
  const isiPadOSDesktopMode = /macintosh/i.test(userAgent) && maxTouchPoints > 1;

  if (isiOSDevice || isiPadOSDesktopMode) return 'ios';
  if (userAgent) return 'desktop';

  return 'unknown';
};

export const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;

  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const iosStandalone = window.navigator?.standalone === true;

  return Boolean(displayModeStandalone || iosStandalone);
};

export const trackOncePerSession = (key, callback) => {
  if (typeof window === 'undefined') return;

  if (sessionStorage.getItem(key) === 'true') return;

  sessionStorage.setItem(key, 'true');
  callback();
};

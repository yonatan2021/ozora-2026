/**
 * Retrieves the stored consent object from localStorage.
 * Returns null if not set or invalid.
 */
export const getStoredConsent = () => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('ozora_cookie_consent');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Saves the consent preferences object to localStorage.
 */
export const setStoredConsent = (preferences) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ozora_cookie_consent', JSON.stringify(preferences));
};

/**
 * Dynamically loads the Google Analytics 4 scripts into the document head.
 */
export const initializeGA4 = () => {
  if (typeof window === 'undefined') return;
  
  // Prevent duplicate loading
  if (document.getElementById('ozora-ga4-script')) return;
  
  const trackingId = 'G-JF3D6KBQ68';
  
  const script = document.createElement('script');
  script.id = 'ozora-ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', trackingId);
};

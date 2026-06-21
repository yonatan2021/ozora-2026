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
 * Dynamically loads the Google Analytics 4 scripts into the document head
 * and configures default Consent Mode v2 settings.
 */
export const initializeGA4 = () => {
  if (typeof window === 'undefined') return;
  
  // Prevent duplicate loading
  if (document.getElementById('ozora-ga4-script')) return;
  
  const trackingId = 'G-JF3D6KBQ68';
  
  // 1. Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  
  // 2. Determine default consent states based on saved preferences
  const storedConsent = getStoredConsent();
  const analyticsGranted = storedConsent ? storedConsent.analytics : false;
  const functionalGranted = storedConsent ? storedConsent.functional : false;
  const marketingGranted = storedConsent ? storedConsent.marketing : false;

  window.gtag('consent', 'default', {
    'analytics_storage': analyticsGranted ? 'granted' : 'denied',
    'ad_storage': marketingGranted ? 'granted' : 'denied',
    'ad_user_data': marketingGranted ? 'granted' : 'denied',
    'ad_personalization': marketingGranted ? 'granted' : 'denied',
    'personalization_storage': functionalGranted ? 'granted' : 'denied',
    'functionality_storage': functionalGranted ? 'granted' : 'denied',
    'security_storage': 'granted' // necessary is always granted
  });
  
  // 3. Load the Google tag script
  const script = document.createElement('script');
  script.id = 'ozora-ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);

  // 4. Run standard config
  window.gtag('js', new Date());
  window.gtag('config', trackingId);
};

/**
 * Updates Google Analytics 4 consent status when preferences are updated.
 */
export const updateGAConsent = (preferences) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('consent', 'update', {
    'analytics_storage': preferences.analytics ? 'granted' : 'denied',
    'ad_storage': preferences.marketing ? 'granted' : 'denied',
    'ad_user_data': preferences.marketing ? 'granted' : 'denied',
    'ad_personalization': preferences.marketing ? 'granted' : 'denied',
    'personalization_storage': preferences.functional ? 'granted' : 'denied',
    'functionality_storage': preferences.functional ? 'granted' : 'denied'
  });
};

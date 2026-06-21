import { getStoredConsent } from './consent.js';

/**
 * Safely tracks a custom GA4 event if the user has granted analytics consent.
 * @param {string} eventName
 * @param {Object} params
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined') return;

  if (!window.gtag) {
    if (import.meta.env.MODE === 'development') {
      console.warn(`[GA4 Offline] Event: ${eventName}`, params);
    }
    return;
  }

  const consent = getStoredConsent();
  if (!consent || !consent.analytics) {
    if (import.meta.env.MODE === 'development') {
      console.log(`[GA4 Consent Blocked] Event: ${eventName}`, params);
    }
    return;
  }

  window.gtag('event', eventName, params);
};

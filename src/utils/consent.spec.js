import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredConsent, setStoredConsent, initializeGA4 } from './consent.js';

describe('consent utils', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    window.dataLayer = undefined;
    window.gtag = undefined;
  });

  it('should get and set stored consent', () => {
    expect(getStoredConsent()).toBeNull();
    const prefs = { analytics: true, functional: false, marketing: false };
    setStoredConsent(prefs);
    expect(getStoredConsent()).toEqual(prefs);
  });

  it('should initialize Google Analytics and register script element', () => {
    initializeGA4();
    const script = document.getElementById('ozora-ga4-script');
    expect(script).toBeInTheDocument();
    expect(script.src).toContain('googletagmanager.com/gtag/js');
    expect(window.gtag).toBeDefined();
  });
});

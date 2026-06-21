import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackEvent } from './analytics.js';
import { setStoredConsent } from './consent.js';

describe('analytics utility', () => {
  beforeEach(() => {
    localStorage.clear();
    window.gtag = vi.fn();
  });

  it('should not call window.gtag if consent is denied or missing', () => {
    trackEvent('test_event', { key: 'value' });
    expect(window.gtag).not.toHaveBeenCalled();

    setStoredConsent({ analytics: false });
    trackEvent('test_event', { key: 'value' });
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('should call window.gtag if consent is granted', () => {
    setStoredConsent({ analytics: true });
    trackEvent('test_event', { key: 'value' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'test_event', { key: 'value' });
  });
});

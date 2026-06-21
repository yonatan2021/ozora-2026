import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectInstallPlatform,
  isStandalonePWA,
  trackOncePerSession,
} from './pwaInstall.js';

describe('pwa install utilities', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: false,
    });
  });

  it('detects iOS from iPhone user agent', () => {
    const platform = detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      maxTouchPoints: 5,
    });

    expect(platform).toBe('ios');
  });

  it('detects iOS from iPadOS desktop-style user agent with touch', () => {
    const platform = detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      maxTouchPoints: 5,
    });

    expect(platform).toBe('ios');
  });

  it('detects Android from user agent', () => {
    const platform = detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
      maxTouchPoints: 5,
    });

    expect(platform).toBe('android');
  });

  it('detects desktop from non-mobile user agent', () => {
    const platform = detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      maxTouchPoints: 0,
    });

    expect(platform).toBe('desktop');
  });

  it('detects standalone display mode', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(display-mode: standalone)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    expect(isStandalonePWA()).toBe(true);
  });

  it('detects iOS navigator standalone mode', () => {
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: true,
    });

    expect(isStandalonePWA()).toBe(true);
  });

  it('runs a session callback once per key', () => {
    const callback = vi.fn();

    trackOncePerSession('ozora-test-key', callback);
    trackOncePerSession('ozora-test-key', callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('ozora-test-key')).toBe('true');
  });
});

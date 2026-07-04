import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FooterInstallCTA from './FooterInstallCTA.jsx';
import { setStoredConsent } from '../utils/consent.js';

const dispatchBeforeInstallPrompt = (outcome = 'accepted') => {
  const event = new Event('beforeinstallprompt');
  event.preventDefault = vi.fn();
  event.prompt = vi.fn();
  event.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
};

describe('FooterInstallCTA', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.gtag = vi.fn();

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: false,
    });
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(display-mode: standalone)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders the mobile footer CTA copy', () => {
    render(<FooterInstallCTA lang="en" />);

    expect(screen.getByText('Open once with internet before the festival to save it offline.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Install now/i })).toBeInTheDocument();
  });

  it('does not render when already standalone', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(display-mode: standalone)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<FooterInstallCTA lang="en" />);

    expect(screen.queryByText('Open once with internet before the festival to save it offline.')).not.toBeInTheDocument();
  });

  it('tracks footer CTA view and click with consent', () => {
    setStoredConsent({ analytics: true });

    render(<FooterInstallCTA lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Install now/i }));

    expect(window.gtag).toHaveBeenCalledWith('event', 'pwa_install_cta', {
      action: 'view',
      source: 'footer',
      platform: 'ios',
    });
    expect(window.gtag).toHaveBeenCalledWith('event', 'pwa_install_cta', {
      action: 'click',
      source: 'footer',
      platform: 'ios',
    });
  });

  it('shows iOS fallback instructions when no prompt is available', () => {
    render(<FooterInstallCTA lang="en" />);

    fireEvent.click(screen.getByRole('button', { name: /Install now/i }));

    expect(screen.getByText(/open this page online first/i)).toBeInTheDocument();
  });

  it('uses the deferred prompt and tracks the result when available', async () => {
    setStoredConsent({ analytics: true });
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
    });

    render(<FooterInstallCTA lang="en" />);
    const promptEvent = dispatchBeforeInstallPrompt('dismissed');

    fireEvent.click(screen.getByRole('button', { name: /Install now/i }));

    expect(promptEvent.preventDefault).toHaveBeenCalled();
    expect(promptEvent.prompt).toHaveBeenCalled();
    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith('event', 'pwa_install_cta', {
        action: 'result',
        source: 'footer',
        platform: 'android',
        outcome: 'dismissed',
      });
    });
  });
});

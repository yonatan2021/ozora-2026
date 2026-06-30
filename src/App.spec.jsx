import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

let mockNeedRefresh = false;
const mockSetNeedRefresh = vi.fn();
const mockUpdateServiceWorker = vi.fn();
const storedCookieConsent = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
};

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
    updateServiceWorker: mockUpdateServiceWorker,
  })),
}));

describe('App End-to-End Flows', () => {
  beforeEach(() => {
    mockNeedRefresh = false;
    mockSetNeedRefresh.mockClear();
    mockUpdateServiceWorker.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });
  });

  it('should support switching languages between Hebrew and English', () => {
    render(<App />);

    // Trigger language switch to English
    const enBtn = screen.getByRole('button', { name: /English/i });
    fireEvent.click(enBtn);
    expect(screen.getByAltText('OZORA 2026 TIMETABLE')).toBeInTheDocument();

    // Trigger language switch to Hebrew
    const heBtn = screen.getByRole('button', { name: /עברית/i });
    fireEvent.click(heBtn);
    expect(screen.getByAltText('לוח הופעות אוזורה 2026')).toBeInTheDocument();
  });

  it('should switch navigation tabs (Timetable, My Schedule, Guide)', () => {
    render(<App />);
    
    // Switch to English to simplify element matching
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    // Switch to My Schedule tab
    const myScheduleNavBtn = screen.getAllByRole('button', { name: /My Schedule/i })[0];
    fireEvent.click(myScheduleNavBtn);
    expect(screen.getByText(/Your schedule is empty/i)).toBeInTheDocument();

    // Switch to Guide tab
    const guideNavBtn = screen.getAllByRole('button', { name: /Guide/i })[0];
    fireEvent.click(guideNavBtn);
    expect(screen.getByText(/מדריך הפסטיבל/i)).toBeInTheDocument();
  });

  it('should render the footer offline install CTA', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    expect(screen.getByText('Open once with internet before the festival to save it offline.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Install now/i })).toBeInTheDocument();
  });

  it('does not show the PWA update prompt by default', () => {
    render(<App />);

    expect(screen.queryByText('גרסה חדשה זמינה')).not.toBeInTheDocument();
  });

  it('shows the PWA update prompt when a new version is waiting', () => {
    mockNeedRefresh = true;
    localStorage.setItem('ozora_cookie_consent', JSON.stringify(storedCookieConsent));

    render(<App />);

    expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
  });

  it('does not show the PWA update prompt over unresolved cookie consent', () => {
    mockNeedRefresh = true;

    render(<App />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/אנחנו משתמשים בקבצי עוגיות/i)).toBeInTheDocument();
    expect(screen.queryByText('גרסה חדשה זמינה')).not.toBeInTheDocument();
  });

  it('shows the PWA update prompt after cookie consent is resolved', () => {
    mockNeedRefresh = true;

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'דחיית עוגיות' }));

    expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
  });

  it('should pin a specific theme and save state to localStorage', () => {
    const { container } = render(<App />);

    // Switch to English to simplify element matching
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    // Click on simulate festival button to open simulator controls
    const simBtn = screen.getByRole('button', { name: /Simulate Festival/i });
    fireEvent.click(simBtn);

    // Find the Sunset theme option button
    const sunsetBtn = screen.getByRole('button', { name: /Sunset/i });
    expect(sunsetBtn).toBeTruthy();
    fireEvent.click(sunsetBtn);

    // Verify localStorage updated
    expect(localStorage.getItem('ozora_pinned_theme')).toBe('theme-sunset');
  });
});

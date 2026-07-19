import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router';

function renderApp(initialPath = '/timetable') {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialPath],
  });
  return render(<RouterProvider router={router} />);
}

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
    renderApp();

    // Trigger language switch to English
    const enBtn = screen.getByRole('button', { name: /English/i });
    fireEvent.click(enBtn);
    expect(screen.getByAltText('OZORA 2026 TIMETABLE')).toBeInTheDocument();

    // Trigger language switch to Hebrew
    const heBtn = screen.getByRole('button', { name: /עברית/i });
    fireEvent.click(heBtn);
    expect(screen.getByAltText('לוח הופעות אוזורה 2026')).toBeInTheDocument();
  });

  it('should switch navigation tabs (Timetable, My Schedule, Guide)', async () => {
    renderApp();
    
    // Switch to English to simplify element matching
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    // Switch to My Schedule tab
    const myScheduleNavBtn = screen.getAllByRole('button', { name: /My Schedule/i })[0];
    fireEvent.click(myScheduleNavBtn);
    expect(await screen.findByText(/Your schedule is empty/i)).toBeInTheDocument();

    // Switch to Guide tab
    const guideNavBtn = screen.getAllByRole('button', { name: /Guide/i })[0];
    fireEvent.click(guideNavBtn);
    expect(await screen.findByText(/Festival Guide/i)).toBeInTheDocument();
  });

  it('should render the footer offline install CTA', () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    expect(screen.getByText('Open once with internet before the festival to save it offline.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Install now/i })).toBeInTheDocument();
  });

  it('does not show the PWA update prompt by default', () => {
    renderApp();

    expect(screen.queryByText('גרסה חדשה זמינה')).not.toBeInTheDocument();
  });

  it('shows the PWA update prompt when a new version is waiting', () => {
    mockNeedRefresh = true;
    localStorage.setItem('ozora_cookie_consent', JSON.stringify(storedCookieConsent));

    renderApp();

    expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
  });

  it('does not show the PWA update prompt over unresolved cookie consent', () => {
    mockNeedRefresh = true;

    renderApp();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/אנחנו משתמשים בקבצי עוגיות/i)).toBeInTheDocument();
    expect(screen.queryByText('גרסה חדשה זמינה')).not.toBeInTheDocument();
  });

  it('shows the PWA update prompt after cookie consent is resolved', () => {
    mockNeedRefresh = true;

    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'דחיית עוגיות' }));

    expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
  });

  it('should pin a specific theme and save state to localStorage', () => {
    const { container } = renderApp();

    // Switch to English to simplify element matching
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    // Click on the Atmosphere dropdown button in the header
    const themeDropdownBtn = screen.getByRole('button', { name: /Atmosphere/i });
    fireEvent.click(themeDropdownBtn);

    // Find the Sunset theme option button in the dropdown
    const sunsetBtn = screen.getByRole('button', { name: /Sunset/i });
    expect(sunsetBtn).toBeTruthy();
    fireEvent.click(sunsetBtn);

    // Verify localStorage updated
    expect(localStorage.getItem('ozora_pinned_theme')).toBe('theme-sunset');
  });

  it('should dynamically update the meta description when switching tabs', () => {
    renderApp();
    
    // Select english
    fireEvent.click(screen.getByRole('button', { name: /English/i }));
    
    // Default /timetable
    let metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc.getAttribute('content')).toContain('Complete Ozora Festival 2026 timetable');

    // Go to guide
    const guideNavBtn = screen.getAllByRole('button', { name: /Guide/i })[0];
    fireEvent.click(guideNavBtn);
    
    metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc.getAttribute('content')).toContain('The ultimate survival guide');
  });

  it('should dynamically update the canonical link tag when switching tabs', () => {
    renderApp();
    
    // Select english
    fireEvent.click(screen.getByRole('button', { name: /English/i }));
    
    // Default /timetable
    let canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toBeTruthy();
    expect(canonical.getAttribute('href')).toBe('https://ozora-2026-taupe.vercel.app/timetable');

    // Go to guide
    const guideNavBtn = screen.getAllByRole('button', { name: /Guide/i })[0];
    fireEvent.click(guideNavBtn);
    
    canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical.getAttribute('href')).toBe('https://ozora-2026-taupe.vercel.app/guide');
  });
});

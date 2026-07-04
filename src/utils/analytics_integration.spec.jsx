import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../router';
import { setStoredConsent } from './consent';
import SetModal from '../components/SetModal';

vi.mock('./consent', async () => {
  const actual = await vi.importActual('./consent');
  return {
    ...actual,
    initializeGA4: vi.fn(),
  };
});

describe('Analytics Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setStoredConsent({ analytics: true });
    window.gtag = vi.fn();
  });

  it('tracks page_view on routing', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/timetable'],
    });
    render(<RouterProvider router={router} />);

    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/timetable',
      page_title: '/timetable',
    });
  });

  it('tracks deep_link_resolved on mount', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/timetable?day=day-1'],
    });
    render(<RouterProvider router={router} />);

    expect(window.gtag).toHaveBeenCalledWith('event', 'deep_link_resolved', {});
  });

  it('tracks shared_link_opened on mount', () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = {
      search: '?share=0,1',
      pathname: '/timetable',
      hash: '',
    };

    const router = createMemoryRouter(routes, {
      initialEntries: ['/timetable?share=0,1'],
    });
    render(<RouterProvider router={router} />);

    expect(window.gtag).toHaveBeenCalledWith('event', 'shared_link_opened', {});

    window.location = originalLocation;
  });

  it('tracks schedule_empty_state on mount when favorites is empty', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/favorites'],
    });
    render(<RouterProvider router={router} />);

    expect(window.gtag).toHaveBeenCalledWith('event', 'schedule_empty_state', {});
  });
});

describe('SetModal Analytics', () => {
  const mockSet = { id: 'set-1', artist: 'Astrix', stage: 'OZORA STAGE', day: 'DAY 1', start: '22:00', end: '23:30', date: '2026-07-27', type: 'Trance' };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setStoredConsent({ analytics: true });
    window.gtag = vi.fn();
  });

  it('tracks artist_modal_open and artist_modal_close with duration', () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <SetModal
        set={mockSet}
        lang="en"
        favorites={[]}
        toggleFavorite={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(window.gtag).toHaveBeenCalledWith('event', 'artist_modal_open', {
      artist_name: 'Astrix',
      stage_name: 'OZORA STAGE',
      day_name: 'DAY 1',
    });

    act(() => {
      vi.advanceTimersByTime(5500);
    });

    rerender(
      <SetModal
        set={null}
        lang="en"
        favorites={[]}
        toggleFavorite={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(window.gtag).toHaveBeenCalledWith('event', 'artist_modal_close', {
      artist_name: 'Astrix',
      duration_seconds: 6,
    });

    vi.useRealTimers();
  });
});

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAppState from './useAppState';

import { trackEvent } from '../utils/analytics';

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock friends utilities — no real localStorage side effects
vi.mock('../utils/friends', () => ({
  getMyScheduleId: vi.fn(() => 'test-id-123'),
  getFriends: vi.fn(() => ({})),
  saveFriend: vi.fn(() => true),
}));

// Helper: produce a real Base64url-encoded payload (same algorithm as compressPayload)
function encodePayload(payload) {
  const jsonStr = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(jsonStr);
  const binaryStr = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
  const base64 = btoa(binaryStr);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('useAppState hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize language and persist it', () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current.lang).toBe('he');

    act(() => {
      result.current.setLang('en');
    });

    expect(result.current.lang).toBe('en');
    expect(localStorage.getItem('ozora_lang')).toBe('en');
    expect(trackEvent).toHaveBeenCalledWith('language_change', { target_language: 'en' });
  });

  it('should handle favorites, toggle favorites and map them to IDs', () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current.favorites).toEqual([]);

    act(() => {
      // Toggle a favorite by set ID
      // "set-1" has artist "Switch Nollie & Tsu", day "Warmup Sat", stage "PUMPUI"
      result.current.toggleFavorite('set-1');
    });

    // The unique key for "set-1" is "Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00"
    const expectedKey = 'Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00';
    expect(result.current.favorites).toContain(expectedKey);
    expect(result.current.childFavorites).toContain('set-1');

    act(() => {
      result.current.toggleFavorite('set-1');
    });
    expect(result.current.favorites).not.toContain(expectedKey);
    expect(result.current.childFavorites).not.toContain('set-1');
  });

  it('should dismiss toast message after 3000ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setToastMessage('Hello test');
    });

    expect(result.current.toastMessage).toBe('Hello test');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toastMessage).toBe('');
    vi.useRealTimers();
  });

  it('should initialize pendingImport from URL query param share if present', () => {
    // Build a proper Base64url payload: two sets (indices 0 and 1), unknown friend
    const payload = {
      id: 'unknown-friend-abc',
      name: 'Test Friend',
      sets: [
        [0, 1, ''],   // index 0 → set-1, priority "must"
        [1, 2, ''],   // index 1 → set-2, priority "want"
      ],
    };
    const shareParam = encodePayload(payload);

    const originalLocation = window.location;
    delete window.location;
    window.location = {
      search: `?share=${shareParam}`,
      pathname: '/',
      hash: '',
    };

    const { result } = renderHook(() => useAppState());

    // pendingImport should now be an object with the parsed data
    expect(result.current.pendingImport).not.toBeNull();
    expect(result.current.pendingImport.id).toBe('unknown-friend-abc');
    expect(result.current.pendingImport.name).toBe('Test Friend');
    expect(result.current.pendingImport.sets).toHaveLength(2);
    // Composite key for index 0 (set-1)
    expect(result.current.pendingImport.sets[0]).toBe('Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00');
    // Composite key for index 1 (set-2)
    expect(result.current.pendingImport.sets[1]).toBe('Siblicity::PUMPUI::2026-07-25::19:00');
    expect(result.current.pendingImport.priorities['Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00']).toBe('must');
    expect(result.current.pendingImport.priorities['Siblicity::PUMPUI::2026-07-25::19:00']).toBe('want');
    expect(trackEvent).toHaveBeenCalledWith('shared_link_opened');

    window.location = originalLocation;
  });

  it('should initialize and synchronize hasCamp and hasCookieConsent', () => {
    localStorage.setItem('ozora_my_camp', '123');
    const { result } = renderHook(() => useAppState());
    expect(result.current.hasCamp).toBe(true);
    expect(result.current.hasCookieConsent).toBe(false);
  });
});

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAppState from './useAppState';

import { trackEvent } from '../utils/analytics';

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

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
    const originalLocation = window.location;
    delete window.location;
    window.location = {
      search: '?share=0,1',
      pathname: '/',
      hash: '',
    };

    const { result } = renderHook(() => useAppState());
    expect(result.current.pendingImport).toHaveLength(2);
    expect(result.current.pendingImport[0].id).toBe('set-1');
    expect(result.current.pendingImport[1].id).toBe('set-2');
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

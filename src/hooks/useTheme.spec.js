import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTheme from './useTheme';

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default time-based theme if no pinned theme', () => {
    // 12:00 PM (noon) -> 'theme-day'
    const evalTime = new Date('2026-07-25T12:00:00').getTime();
    const { result } = renderHook(() => useTheme(evalTime));
    
    expect(result.current.pinnedTheme).toBeNull();
    expect(result.current.activeThemeClass).toBe('theme-day');
  });

  it('should return theme-night between 8 PM and 5 AM', () => {
    const evalTimeNight = new Date('2026-07-25T23:00:00').getTime();
    const { result } = renderHook(() => useTheme(evalTimeNight));
    expect(result.current.activeThemeClass).toBe('theme-night');
  });

  it('should return theme-sunrise between 5 AM and 7 AM', () => {
    const evalTimeSunrise = new Date('2026-07-25T06:00:00').getTime();
    const { result } = renderHook(() => useTheme(evalTimeSunrise));
    expect(result.current.activeThemeClass).toBe('theme-sunrise');
  });

  it('should return theme-sunset between 6 PM and 8 PM', () => {
    const evalTimeSunset = new Date('2026-07-25T19:00:00').getTime();
    const { result } = renderHook(() => useTheme(evalTimeSunset));
    expect(result.current.activeThemeClass).toBe('theme-sunset');
  });

  it('should pin a theme and persist to localStorage', () => {
    const evalTime = new Date('2026-07-25T12:00:00').getTime();
    const { result } = renderHook(() => useTheme(evalTime));

    act(() => {
      result.current.setPinnedTheme('theme-sunset');
    });

    expect(result.current.pinnedTheme).toBe('theme-sunset');
    expect(result.current.activeThemeClass).toBe('theme-sunset');
    expect(localStorage.getItem('ozora_pinned_theme')).toBe('theme-sunset');
  });
});

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useUrlSync from './useUrlSync';
import { trackEvent } from '../utils/analytics';

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

let mockSearchString = '';
const mockSetSearchParams = vi.fn((updater) => {
  if (typeof updater === 'function') {
    const currentParams = new URLSearchParams(mockSearchString);
    const newParams = updater(currentParams);
    mockSearchString = '?' + newParams.toString();
  } else {
    mockSearchString = '?' + new URLSearchParams(updater).toString();
  }
});

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(mockSearchString), mockSetSearchParams],
}));

describe('useUrlSync hook', () => {
  beforeEach(() => {
    mockSearchString = '';
    mockSetSearchParams.mockClear();
    vi.clearAllMocks();
  });

  it('should parse URL search parameters and expose states', () => {
    mockSearchString = '?day=warmup-sun&stage=PUMPUI&set=set-2';

    const { result } = renderHook(() => useUrlSync());

    expect(result.current.selectedDay).toBe('Warmup Sun');
    expect(result.current.selectedStage).toBe('PUMPUI');
    expect(result.current.selectedSet).not.toBeNull();
    expect(result.current.selectedSet.id).toBe('set-2');
    expect(trackEvent).toHaveBeenCalledWith('deep_link_resolved');
  });

  it('should fallback to default values when search parameters are missing or invalid', () => {
    mockSearchString = '';

    const { result } = renderHook(() => useUrlSync());

    expect(result.current.selectedDay).toBe('Warmup Sat');
    expect(result.current.selectedStage).toBe('ALL');
    expect(result.current.selectedSet).toBeNull();
  });

  it('should update query parameters via setters', () => {
    mockSearchString = '';

    const { result, rerender } = renderHook(() => useUrlSync());

    act(() => {
      result.current.setSelectedDay('DAY 1');
    });
    expect(mockSetSearchParams).toHaveBeenCalled();
    rerender();
    expect(result.current.selectedDay).toBe('DAY 1');

    act(() => {
      result.current.setSelectedStage('OZORA STAGE');
    });
    rerender();
    expect(result.current.selectedStage).toBe('OZORA STAGE');

    act(() => {
      result.current.setSelectedSet({ id: 'set-3' });
    });
    rerender();
    expect(result.current.selectedSet.id).toBe('set-3');
  });
});

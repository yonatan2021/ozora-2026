import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeSimulator from './TimeSimulator';

describe('TimeSimulator Component', () => {
  it('should toggle simulation mode and call callbacks', () => {
    const setSimTime = vi.fn();
    const setIsSimulated = vi.fn();
    
    render(
      <TimeSimulator 
        lang="en"
        simTime={new Date('2026-07-27T12:00:00').getTime()}
        setSimTime={setSimTime}
        isSimulated={false}
        setIsSimulated={setIsSimulated}
        selectedDay="DAY 1"
        pinnedTheme={null}
        setPinnedTheme={vi.fn()}
        activeThemeClass="theme-day"
        onOpenLiveModal={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Simulate Festival/i });
    fireEvent.click(toggleBtn);
    expect(setIsSimulated).toHaveBeenCalledWith(true);
  });

  it('should initialize simulation time relative to the selected day on enable', () => {
    const setSimTime = vi.fn();
    const setIsSimulated = vi.fn();
    
    render(
      <TimeSimulator 
        lang="en"
        simTime={new Date('2026-07-29T12:00:00').getTime()}
        setSimTime={setSimTime}
        isSimulated={false}
        setIsSimulated={setIsSimulated}
        selectedDay="DAY 3"
        isThemeLocked={false}
        setIsThemeLocked={vi.fn()}
        onOpenLiveModal={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Simulate Festival/i });
    fireEvent.click(toggleBtn);
    expect(setIsSimulated).toHaveBeenCalledWith(true);
    expect(setSimTime).toHaveBeenCalledWith(new Date('2026-07-29T20:00:00').getTime());
  });

  it('should show controls and allow changing simulated time when isSimulated is true', () => {
    const setSimTime = vi.fn();
    const mockOpenLiveModal = vi.fn();
    const mockScrollToActive = vi.fn();
    
    render(
      <TimeSimulator 
        lang="en"
        simTime={new Date('2026-07-27T12:00:00').getTime()}
        setSimTime={setSimTime}
        isSimulated={true}
        setIsSimulated={vi.fn()}
        selectedDay="DAY 1"
        pinnedTheme={null}
        setPinnedTheme={vi.fn()}
        activeThemeClass="theme-day"
        onOpenLiveModal={mockOpenLiveModal}
        onScrollToActive={mockScrollToActive}
      />
    );

    // Range input
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: new Date('2026-07-27T15:00:00').getTime().toString() } });
    expect(setSimTime).toHaveBeenCalled();

    // Take Me There
    const takeMeThereBtn = screen.getByRole('button', { name: /Take Me There/i });
    fireEvent.click(takeMeThereBtn);
    expect(mockScrollToActive).toHaveBeenCalled();

    // What's Playing Now
    const whatsPlayingBtn = screen.getByRole('button', { name: /What's Playing Now\?/i });
    fireEvent.click(whatsPlayingBtn);
    expect(mockOpenLiveModal).toHaveBeenCalled();
  });

  it('should call setPinnedTheme when a theme option is clicked', () => {
    const setPinnedTheme = vi.fn();
    render(
      <TimeSimulator 
        lang="en"
        simTime={new Date('2026-07-27T12:00:00').getTime()}
        setSimTime={vi.fn()}
        isSimulated={true}
        setIsSimulated={vi.fn()}
        selectedDay="DAY 1"
        pinnedTheme={null}
        setPinnedTheme={setPinnedTheme}
        activeThemeClass="theme-day"
        onOpenLiveModal={vi.fn()}
      />
    );

    // Select the "Sunset" theme button
    const sunsetBtn = screen.getByRole('button', { name: /Sunset/i });
    fireEvent.click(sunsetBtn);
    expect(setPinnedTheme).toHaveBeenCalledWith('theme-sunset');
  });
});

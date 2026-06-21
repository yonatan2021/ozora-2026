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
        onOpenLiveModal={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Simulate Festival/i });
    fireEvent.click(toggleBtn);
    expect(setIsSimulated).toHaveBeenCalledWith(true);
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
        onOpenLiveModal={mockOpenLiveModal}
        onScrollToActive={mockScrollToActive}
      />
    );

    // Range input
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: new Date('2026-07-28T10:00:00').getTime().toString() } });
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
});

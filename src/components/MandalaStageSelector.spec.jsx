import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MandalaStageSelector from './MandalaStageSelector';

describe('MandalaStageSelector Component', () => {
  it('renders all stage options and triggers callback on click', () => {
    const onChange = vi.fn();
    render(<MandalaStageSelector selectedStage="ALL" onChange={onChange} lang="en" />);

    const stages = [
      { name: 'PUMPUI', title: /^PUMPUI$/i },
      { name: 'OZORA STAGE', title: /^OZORA STAGE$/i },
      { name: 'THE DOME', title: /^THE DOME$/i },
      { name: 'DRAGON NEST / COOKING GROOVE', title: /DRAGON NEST \/ COOKING GROOVE/i },
      { name: 'VISIUM GARDEN', title: /^VISIUM GARDEN$/i },
      { name: 'TEK ZERO (2000s Trance)', title: /TEK ZERO \(2000s Trance\)/i }
    ];

    stages.forEach(({ name, title }) => {
      // Expecting 2 buttons matching this title: one in mobile scrollbar, one in desktop wheel
      const buttons = screen.getAllByTitle(title);
      expect(buttons.length).toBe(2);
      
      // Test mobile button click
      fireEvent.click(buttons[0]);
      expect(onChange).toHaveBeenLastCalledWith(name);

      // Test desktop button click
      fireEvent.click(buttons[1]);
      expect(onChange).toHaveBeenLastCalledWith(name);
    });

    // Also verify 'ALL' button for both views
    const allButtons = screen.getAllByTitle(/All Stages/i);
    expect(allButtons.length).toBe(2);

    // Test mobile 'ALL' click
    fireEvent.click(allButtons[0]);
    expect(onChange).toHaveBeenLastCalledWith('ALL');

    // Test desktop 'ALL' click
    fireEvent.click(allButtons[1]);
    expect(onChange).toHaveBeenLastCalledWith('ALL');
  });

  it('renders correct labels/names in Hebrew', () => {
    const onChange = vi.fn();
    render(<MandalaStageSelector selectedStage="ALL" onChange={onChange} lang="he" />);
    
    // Check that Hebrew short names are rendered inside the component
    expect(screen.getAllByText('פומפוי').length).toBeGreaterThan(0);
    expect(screen.getAllByText('אוזורה').length).toBeGreaterThan(0);
    expect(screen.getAllByText('הדום').length).toBeGreaterThan(0);
    expect(screen.getAllByText('דרגון נסט').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ויזיום').length).toBeGreaterThan(0);
    expect(screen.getAllByText('טק זירו').length).toBeGreaterThan(0);
  });
});

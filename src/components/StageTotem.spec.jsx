import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StageTotem from './StageTotem';

describe('StageTotem Component', () => {
  it('renders correct totem for OZORA STAGE', () => {
    const { container } = render(<StageTotem stage="OZORA STAGE" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.innerHTML).toContain('totem-ozora');
  });

  it('renders correct totem for PUMPUI', () => {
    const { container } = render(<StageTotem stage="PUMPUI" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.innerHTML).toContain('totem-pumpui');
  });

  it('renders correct totem for THE DOME', () => {
    const { container } = render(<StageTotem stage="THE DOME" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.innerHTML).toContain('totem-dome');
  });

  it('renders correct totem for DRAGON NEST', () => {
    const { container } = render(<StageTotem stage="DRAGON NEST" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.innerHTML).toContain('totem-dragon');
  });

  it('renders correct totem for VISIUM GARDEN', () => {
    const { container } = render(<StageTotem stage="VISIUM GARDEN" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.innerHTML).toContain('totem-visium');
  });

  it('renders correct totem for TEK ZERO (2000s Trance)', () => {
    const { container } = render(<StageTotem stage="TEK ZERO (2000s Trance)" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.innerHTML).toContain('totem-tekzero');
  });

  it('renders correct totem for default/ALL stage', () => {
    const { container } = render(<StageTotem stage="ALL" />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.innerHTML).toContain('totem-all');
  });
});

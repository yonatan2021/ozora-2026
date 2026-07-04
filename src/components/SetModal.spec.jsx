import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SetModal from './SetModal';

// Mock getArtistConnections & getSetsForArtist
vi.mock('../utils/connections', () => ({
  getArtistConnections: (name) => {
    if (name === 'Hallucinogen') {
      return {
        isEnsemble: false,
        members: [{ name: 'Simon Posford', otherProjects: ['Shpongle'] }],
        additionalShowsCount: 1,
        allOtherProjects: ['Shpongle']
      };
    }
    return null;
  },
  getSetsForArtist: (name) => {
    if (name === 'Shpongle') {
      return [{ id: 'set-shpongle', artist: 'Shpongle' }];
    }
    return [];
  }
}));

describe('SetModal connections', () => {
  const mockSet = { id: 'set-hallucinogen', artist: 'Hallucinogen', stage: 'PUMPUI', start: '22:00', end: '23:30', day: 'Warmup Sat' };
  const mockToggleFavorite = vi.fn();
  const mockSelectSet = vi.fn();

  it('renders connections panel if connections exist', () => {
    render(
      <SetModal
        set={mockSet}
        lang="he"
        favorites={[]}
        toggleFavorite={mockToggleFavorite}
        onSelectSet={mockSelectSet}
      />
    );
    expect(screen.getByText('פרויקטים נוספים בפסטיבל')).toBeInTheDocument();
    expect(screen.getByText('Shpongle')).toBeInTheDocument();
  });

  it('triggers onSelectSet when clicking a related project link', () => {
    render(
      <SetModal
        set={mockSet}
        lang="he"
        favorites={[]}
        toggleFavorite={mockToggleFavorite}
        onSelectSet={mockSelectSet}
      />
    );
    const linkBtn = screen.getByText('Shpongle');
    fireEvent.click(linkBtn);
    expect(mockSelectSet).toHaveBeenCalledWith({ id: 'set-shpongle', artist: 'Shpongle' });
  });
});

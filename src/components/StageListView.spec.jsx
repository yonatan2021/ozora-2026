import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageListView from './StageListView';

const mockSets = [
  { id: '1', artist: 'Koxbox', stage: 'THE DOME', start: '16:00', end: '18:00', type: 'LIVE' },
  { id: '2', artist: 'Oforia', stage: 'THE DOME', start: '18:00', end: '20:00', type: 'DJ' },
  { id: '3', artist: 'Pumping Act', stage: 'PUMPUI', start: '00:00', end: '03:00', type: 'LIVE', endsNextDay: true },
];

const mockFavorites = ['1'];
const mockToggleFavorite = vi.fn();
const mockOnSetClick = vi.fn();
const mockActiveStatusMap = { '1': 'active', '2': 'upcoming' };

describe('StageListView Component', () => {
  it('renders accordions for stages that have sets', () => {
    render(
      <StageListView
        lang="en"
        sets={mockSets}
        favorites={mockFavorites}
        toggleFavorite={mockToggleFavorite}
        onSetClick={mockOnSetClick}
        activeStatusMap={mockActiveStatusMap}
        selectedStage="ALL"
      />
    );

    // Should render headers for Dome and Pumpui
    expect(screen.getByText('The Dome')).toBeInTheDocument();
    expect(screen.getByText('Pumpui')).toBeInTheDocument();
    
    // Should NOT render headers for other stages (like Ozora Stage)
    expect(screen.queryByText('Ozora Stage')).not.toBeInTheDocument();
  });

  it('calculates and shows operating hours and count of artists', () => {
    render(
      <StageListView
        lang="en"
        sets={mockSets}
        favorites={mockFavorites}
        toggleFavorite={mockToggleFavorite}
        onSetClick={mockOnSetClick}
        activeStatusMap={mockActiveStatusMap}
        selectedStage="ALL"
      />
    );

    // The Dome sets are 16:00 - 18:00 and 18:00 - 20:00. Min start is 16:00, max end is 20:00.
    expect(screen.getByText('16:00 - 20:00')).toBeInTheDocument();
    expect(screen.getByText('2 artists')).toBeInTheDocument();
    
    // Pumpui sets are 00:00 - 03:00 (+1d)
    expect(screen.getByText('00:00 - 03:00 (+1d)')).toBeInTheDocument();
    expect(screen.getByText('1 artists')).toBeInTheDocument();
  });

  it('renders artist sets inside active accordion and allows expanding/collapsing', () => {
    render(
      <StageListView
        lang="en"
        sets={mockSets}
        favorites={mockFavorites}
        toggleFavorite={mockToggleFavorite}
        onSetClick={mockOnSetClick}
        activeStatusMap={mockActiveStatusMap}
        selectedStage="ALL"
      />
    );

    // By default, accordions are collapsed, so artists should NOT be visible
    expect(screen.queryByText('Koxbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Oforia')).not.toBeInTheDocument();
    expect(screen.queryByText('Pumping Act')).not.toBeInTheDocument();

    // Expand The Dome
    const domeHeaderButton = screen.getByText('The Dome').closest('button');
    fireEvent.click(domeHeaderButton);

    // Koxbox and Oforia should now be visible
    expect(screen.getByText('Koxbox')).toBeInTheDocument();
    expect(screen.getByText('Oforia')).toBeInTheDocument();
    
    // Pumpui is still closed, so Pumping Act is not visible
    expect(screen.queryByText('Pumping Act')).not.toBeInTheDocument();

    // Collapse The Dome
    fireEvent.click(domeHeaderButton);
    expect(screen.queryByText('Koxbox')).not.toBeInTheDocument();
  });

  it('triggers onSetClick when clicking a set card', () => {
    mockOnSetClick.mockClear();
    render(
      <StageListView
        lang="en"
        sets={mockSets}
        favorites={mockFavorites}
        toggleFavorite={mockToggleFavorite}
        onSetClick={mockOnSetClick}
        activeStatusMap={mockActiveStatusMap}
        selectedStage="ALL"
      />
    );

    // Expand Dome
    const domeHeaderButton = screen.getByText('The Dome').closest('button');
    fireEvent.click(domeHeaderButton);

    const card = screen.getByText('Koxbox').closest('.feed-set-card');
    fireEvent.click(card);

    expect(mockOnSetClick).toHaveBeenCalledWith(mockSets[0]);
  });

  it('triggers toggleFavorite when clicking favorite button', () => {
    mockToggleFavorite.mockClear();
    render(
      <StageListView
        lang="en"
        sets={mockSets}
        favorites={mockFavorites}
        toggleFavorite={mockToggleFavorite}
        onSetClick={mockOnSetClick}
        activeStatusMap={mockActiveStatusMap}
        selectedStage="ALL"
      />
    );

    // Expand Dome
    const domeHeaderButton = screen.getByText('The Dome').closest('button');
    fireEvent.click(domeHeaderButton);

    const koxboxCard = screen.getByText('Koxbox').closest('.feed-set-card');
    const favBtn = koxboxCard.querySelector('.feed-fav-btn');
    fireEvent.click(favBtn);

    expect(mockToggleFavorite).toHaveBeenCalledWith('1');
  });
});

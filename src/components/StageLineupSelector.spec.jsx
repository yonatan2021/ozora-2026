import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageLineupSelector from './StageLineupSelector';

const baseSets = [
  { id: 1, artist: 'Koxbox & Saiko Pod', stage: 'THE DOME', start: '00:30', end: '02:00' },
  { id: 2, artist: 'Oforia', stage: 'THE DOME', start: '05:00', end: '06:30' },
  { id: 3, artist: 'Some Pumpui Act', stage: 'PUMPUI', start: '01:00', end: '02:30' },
];

const noop = () => {};

describe('StageLineupSelector', () => {
  it('renders only stages present in sets, plus All', () => {
    render(
      <StageLineupSelector
        sets={baseSets}
        selectedStage="ALL"
        onChange={noop}
        lang="en"
        favorites={[]}
        toggleFavorite={noop}
        activeStatusMap={{}}
        onSetClick={noop}
      />
    );
    expect(screen.getByTitle('THE DOME')).toBeTruthy();
    expect(screen.getByTitle('PUMPUI')).toBeTruthy();
    expect(screen.queryByTitle('OZORA STAGE')).toBeNull();
    expect(screen.getByTitle(/All Stages/i)).toBeTruthy();
  });

  it('calls onChange with the stage name when a card header is clicked, and ALL when clicked again while active', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <StageLineupSelector
        sets={baseSets}
        selectedStage="ALL"
        onChange={onChange}
        lang="en"
        favorites={[]}
        toggleFavorite={noop}
        activeStatusMap={{}}
        onSetClick={noop}
      />
    );
    fireEvent.click(screen.getByTitle('THE DOME'));
    expect(onChange).toHaveBeenLastCalledWith('THE DOME');

    rerender(
      <StageLineupSelector
        sets={baseSets}
        selectedStage="THE DOME"
        onChange={onChange}
        lang="en"
        favorites={[]}
        toggleFavorite={noop}
        activeStatusMap={{}}
        onSetClick={noop}
      />
    );
    fireEvent.click(screen.getByTitle('THE DOME'));
    expect(onChange).toHaveBeenLastCalledWith('ALL');
  });

  it('expands to show artist list on chevron click without changing the filter', () => {
    const onChange = vi.fn();
    render(
      <StageLineupSelector
        sets={baseSets}
        selectedStage="ALL"
        onChange={onChange}
        lang="en"
        favorites={[]}
        toggleFavorite={noop}
        activeStatusMap={{}}
        onSetClick={noop}
      />
    );
    expect(screen.queryByText('Oforia')).toBeNull();
    const expandButtons = screen.getAllByLabelText(/Show artist list/i);
    const domeExpandButton = expandButtons.find(btn => {
      const card = btn.closest('.stage-lineup-card');
      return card && card.querySelector('[title="THE DOME"]');
    });
    fireEvent.click(domeExpandButton);
    expect(screen.getByText('Oforia')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles favorite from the expanded artist row without triggering onSetClick', () => {
    const toggleFavorite = vi.fn();
    const onSetClick = vi.fn();
    render(
      <StageLineupSelector
        sets={baseSets}
        selectedStage="ALL"
        onChange={noop}
        lang="en"
        favorites={[]}
        toggleFavorite={toggleFavorite}
        activeStatusMap={{}}
        onSetClick={onSetClick}
      />
    );
    const expandButtons = screen.getAllByLabelText(/Show artist list/i);
    const domeExpandButton = expandButtons.find(btn => {
      const card = btn.closest('.stage-lineup-card');
      return card && card.querySelector('[title="THE DOME"]');
    });
    fireEvent.click(domeExpandButton);
    const favButtons = screen.getAllByRole('button').filter(b => b.className.includes('stage-lineup-artist-fav'));
    fireEvent.click(favButtons[0]);
    expect(toggleFavorite).toHaveBeenCalledWith(1);
    expect(onSetClick).not.toHaveBeenCalled();
  });

  it('renders Hebrew short names', () => {
    render(
      <StageLineupSelector
        sets={baseSets}
        selectedStage="ALL"
        onChange={noop}
        lang="he"
        favorites={[]}
        toggleFavorite={noop}
        activeStatusMap={{}}
        onSetClick={noop}
      />
    );
    expect(screen.getAllByText('הדום').length).toBeGreaterThan(0);
    expect(screen.getAllByText('פומפוי').length).toBeGreaterThan(0);
  });
});

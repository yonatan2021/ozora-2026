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
    expect(screen.getByTitle(/Filter by The Dome/i)).toBeTruthy();
    expect(screen.getByTitle(/Filter by Pumpui/i)).toBeTruthy();
    expect(screen.queryByTitle(/Filter by Ozora/i)).toBeNull();
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
    fireEvent.click(screen.getByTitle(/Filter by The Dome/i));
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
    fireEvent.click(screen.getByTitle(/Filter by The Dome/i));
    expect(onChange).toHaveBeenLastCalledWith('ALL');
  });

  it('does not duplicate the timetable lineup inside the stage selector', () => {
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
    expect(screen.queryByText('Oforia')).toBeNull();
    expect(screen.queryByText('Koxbox & Saiko Pod')).toBeNull();
    expect(screen.queryByLabelText(/Show artist list/i)).toBeNull();
  });

  it('marks the selected stage as a pressed filter', () => {
    render(
      <StageLineupSelector
        sets={baseSets}
        selectedStage="THE DOME"
        onChange={noop}
        lang="en"
        favorites={[]}
        toggleFavorite={noop}
        activeStatusMap={{}}
        onSetClick={noop}
      />
    );
    expect(screen.getByTitle(/Filter by The Dome/i).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle(/Filter by Pumpui/i).getAttribute('aria-pressed')).toBe('false');
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

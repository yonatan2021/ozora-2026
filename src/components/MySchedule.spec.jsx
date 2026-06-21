import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MySchedule from './MySchedule';

const mockData = [
  { id: '1', artist: 'Astrix', stage: 'OZORA STAGE', day: 'DAY 1', start: '22:00', end: '23:30', date: '2026-07-27', type: 'Trance' },
  { id: '2', artist: 'Siblicity', stage: 'PUMPUI', day: 'Warmup Sat', start: '19:00', end: '20:30', date: '2026-07-25', type: 'Ambient' }
];

describe('MySchedule Component', () => {
  it('should render empty state message when no favorites exist', () => {
    render(
      <MySchedule 
        lang="en"
        timetableData={mockData}
        favorites={[]}
        toggleFavorite={vi.fn()}
        onSetClick={vi.fn()}
        simTime={new Date().getTime()}
        isSimulated={false}
        onShowToast={vi.fn()}
        notesVersion={0}
      />
    );
    expect(screen.getByText(/Your schedule is empty/i)).toBeInTheDocument();
  });

  it('should list favorited items', () => {
    render(
      <MySchedule 
        lang="en"
        timetableData={mockData}
        favorites={['1']}
        toggleFavorite={vi.fn()}
        onSetClick={vi.fn()}
        simTime={new Date().getTime()}
        isSimulated={false}
        onShowToast={vi.fn()}
        notesVersion={0}
      />
    );
    expect(screen.getAllByText('Astrix').length).toBeGreaterThan(0);
    expect(screen.queryByText('Siblicity')).not.toBeInTheDocument();
  });
});

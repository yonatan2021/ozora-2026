import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar Component', () => {
  const mockSelect = vi.fn();
  const mockData = [
    { id: '1', artist: 'Astrix', stage: 'OZORA STAGE', day: 'DAY 1', start: '22:00', type: 'Trance' },
    { id: '2', artist: 'Siblicity', stage: 'PUMPUI', day: 'Warmup Sat', start: '19:00', type: 'Ambient' }
  ];

  it('should update query text and show matching suggestions', async () => {
    render(
      <SearchBar 
        lang="en" 
        timetableData={mockData} 
        favorites={[]} 
        toggleFavorite={vi.fn()} 
        onSelectSet={mockSelect} 
      />
    );

    const input = screen.getByPlaceholderText(/Search artist, stage/i);
    fireEvent.change(input, { target: { value: 'Astrix' } });

    expect(screen.getByText('Astrix')).toBeInTheDocument();
    
    const suggestionBtn = screen.getByText('Astrix');
    fireEvent.click(suggestionBtn);
    expect(mockSelect).toHaveBeenCalledWith(mockData[0]);
  });
});

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
    expect(mockSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1', artist: 'Astrix' }));
  });

  it('should display quick tags when empty and focused', () => {
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
    fireEvent.focus(input);
    
    expect(screen.getByText(/⚡ Live/i)).toBeInTheDocument();
    expect(screen.getByText(/🕒 Next Up/i)).toBeInTheDocument();
    expect(screen.getByText(/⭐ My Schedule/i)).toBeInTheDocument();
  });
});

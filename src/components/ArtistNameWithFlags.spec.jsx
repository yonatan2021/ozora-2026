import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArtistNameWithFlags from './ArtistNameWithFlags';

const origins = {
  Astrix: { countries: ['IL'], confidence: 'high' },
  'GMS & Dickster': { countries: ['NL', 'GB'], confidence: 'high' },
  'Gaudi + Don Letts + Earl 16': { countries: ['IT', 'GB', 'JM'], confidence: 'high' },
  Unknown: { countries: ['US'], confidence: 'needs_review' }
};

describe('ArtistNameWithFlags', () => {
  it('renders one flag after the artist name', () => {
    render(<ArtistNameWithFlags artist="Astrix" origins={origins} />);
    expect(screen.getByText('Astrix')).toBeInTheDocument();
    expect(screen.getByLabelText('Origin: Israel')).toHaveTextContent('🇮🇱');
  });

  it('renders two flags around the artist name', () => {
    render(<ArtistNameWithFlags artist="GMS & Dickster" origins={origins} />);
    const flags = screen.getAllByLabelText(/Origin:/);
    expect(flags.map((flag) => flag.textContent)).toEqual(['🇳🇱', '🇬🇧']);
    expect(screen.getByText('GMS & Dickster')).toBeInTheDocument();
  });

  it('renders three or more flags below the artist name', () => {
    const { container } = render(<ArtistNameWithFlags artist="Gaudi + Don Letts + Earl 16" origins={origins} />);
    expect(container.querySelector('.artist-origin-flags.multi')).toBeTruthy();
    expect(screen.getAllByLabelText(/Origin:/).map((flag) => flag.textContent)).toEqual(['🇮🇹', '🇬🇧', '🇯🇲']);
  });

  it('renders only the artist name for unreviewed data', () => {
    render(<ArtistNameWithFlags artist="Unknown" origins={origins} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Origin:/)).toBeNull();
  });

  it('renders only the artist name for missing origin data', () => {
    render(<ArtistNameWithFlags artist="Missing Artist" origins={origins} />);
    expect(screen.getByText('Missing Artist')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Origin:/)).toBeNull();
  });
});

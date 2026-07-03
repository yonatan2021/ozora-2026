import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FestivalGuide from './FestivalGuide';

describe('FestivalGuide — equipment checklist entry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows an equipment checklist card in the guide grid', () => {
    render(<FestivalGuide />);
    expect(screen.getByText('ציוד לפסטיבל')).toBeTruthy();
  });

  it('opens the equipment checklist when the card is clicked', () => {
    render(<FestivalGuide />);
    fireEvent.click(screen.getByText('ציוד לפסטיבל'));
    expect(screen.getByText('ציוד שטח קבוצתי')).toBeTruthy();
  });

  it('returns to the guide grid from the equipment checklist via back button', () => {
    render(<FestivalGuide />);
    fireEvent.click(screen.getByText('ציוד לפסטיבל'));
    fireEvent.click(screen.getByText('חזרה למדריכים'));
    expect(screen.getByText('ציוד לפסטיבל')).toBeTruthy();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App End-to-End Flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should support switching languages between Hebrew and English', () => {
    render(<App />);

    // Trigger language switch to English
    const enBtn = screen.getByRole('button', { name: /English/i });
    fireEvent.click(enBtn);
    expect(screen.getByAltText('OZORA 2026 TIMETABLE')).toBeInTheDocument();

    // Trigger language switch to Hebrew
    const heBtn = screen.getByRole('button', { name: /עברית/i });
    fireEvent.click(heBtn);
    expect(screen.getByAltText('לוח הופעות אוזורה 2026')).toBeInTheDocument();
  });

  it('should switch navigation tabs (Timetable, My Schedule, Guide)', () => {
    render(<App />);
    
    // Switch to English to simplify element matching
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    // Switch to My Schedule tab
    const myScheduleNavBtn = screen.getAllByRole('button', { name: /My Schedule/i })[0];
    fireEvent.click(myScheduleNavBtn);
    expect(screen.getByText(/Your schedule is empty/i)).toBeInTheDocument();

    // Switch to Guide tab
    const guideNavBtn = screen.getAllByRole('button', { name: /Guide/i })[0];
    fireEvent.click(guideNavBtn);
    expect(screen.getByText(/מדריך הפסטיבל/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PWAUpdatePrompt from './PWAUpdatePrompt.jsx';

const updateServiceWorker = vi.fn();
let needRefreshValue = [false, vi.fn()];

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: needRefreshValue,
    updateServiceWorker,
  })),
}));

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    sessionStorage.clear();
    updateServiceWorker.mockClear();
    needRefreshValue = [false, vi.fn()];
  });

  it('does not render when no update is waiting', () => {
    render(<PWAUpdatePrompt lang="en" />);

    expect(screen.queryByText('A new version is available')).not.toBeInTheDocument();
  });

  it('renders localized Hebrew update copy when an update is waiting', () => {
    needRefreshValue = [true, vi.fn()];

    render(<PWAUpdatePrompt lang="he" />);

    expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
    expect(screen.getByText('אפשר לעדכן עכשיו כדי לקבל את השינויים האחרונים.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'עדכן עכשיו' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'דלג' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'סגור הודעת עדכון' })).toBeInTheDocument();
  });

  it('hides the banner for the current session when skipped', () => {
    needRefreshValue = [true, vi.fn()];

    render(<PWAUpdatePrompt lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.queryByText('A new version is available')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('ozora_pwa_update_skipped')).toBe('true');
  });

  it('does not render when the update was already skipped this session', () => {
    sessionStorage.setItem('ozora_pwa_update_skipped', 'true');
    needRefreshValue = [true, vi.fn()];

    render(<PWAUpdatePrompt lang="en" />);

    expect(screen.queryByText('A new version is available')).not.toBeInTheDocument();
  });

  it('asks the waiting service worker to activate when update now is clicked', () => {
    needRefreshValue = [true, vi.fn()];
    updateServiceWorker.mockResolvedValue();

    render(<PWAUpdatePrompt lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Update now' }));

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });
});

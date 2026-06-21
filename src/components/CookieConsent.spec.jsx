import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CookieConsent from './CookieConsent';

describe('CookieConsent Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render consent banner when no consent is stored', () => {
    render(<CookieConsent lang="en" />);
    expect(screen.getByText(/We use cookies to improve your browsing experience/i)).toBeInTheDocument();
  });

  it('should accept all cookies and hide banner', () => {
    render(<CookieConsent lang="en" />);
    const acceptBtn = screen.getByRole('button', { name: 'Accept All' });
    fireEvent.click(acceptBtn);
    expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('ozora_cookie_consent'));
    expect(stored.analytics).toBe(true);
  });

  it('should customize preferences and save choices', () => {
    render(<CookieConsent lang="en" />);
    const customizeBtn = screen.getByRole('button', { name: 'Customize Preferences' });
    fireEvent.click(customizeBtn);

    // Uncheck Analytics (Statistics & Performance)
    const analyticsCheckbox = screen.getByLabelText(/Statistics & Performance/i);
    if (analyticsCheckbox.checked) {
      fireEvent.click(analyticsCheckbox);
    }

    const saveBtn = screen.getByRole('button', { name: 'Save My Choices' });
    fireEvent.click(saveBtn);

    const stored = JSON.parse(localStorage.getItem('ozora_cookie_consent'));
    expect(stored.analytics).toBe(false);
  });
});

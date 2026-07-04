import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OfflineChatbot from './OfflineChatbot';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/timetable' }),
  };
});

describe('OfflineChatbot Navigation Intents and Keywords', () => {
  const defaultProps = {
    lang: 'he',
    favorites: [],
    toggleFavorite: vi.fn(),
    onSelectSet: vi.fn(),
    onShowOnMap: vi.fn(),
    evalTime: new Date('2026-07-25T12:00:00Z').getTime(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = vi.fn();
    mockNavigate.mockClear();
    defaultProps.toggleFavorite.mockClear();
    defaultProps.onSelectSet.mockClear();
    defaultProps.onShowOnMap.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const openChat = () => {
    render(
      <MemoryRouter>
        <OfflineChatbot {...defaultProps} />
      </MemoryRouter>
    );
    const toggleBtn = screen.getByRole('button', { name: /Toggle offline chatbot/i });
    fireEvent.click(toggleBtn);
  };

  const submitQuery = (text) => {
    const input = screen.getByPlaceholderText(/כתוב שאלה חופשית.../i);
    fireEvent.change(input, { target: { value: text } });
    const form = input.closest('form');
    fireEvent.submit(form);
    
    // Advance timers past the 600ms chatbot response delay
    act(() => {
      vi.advanceTimersByTime(600);
    });
  };

  it('should open chatbot and show welcome message', () => {
    openChat();
    expect(screen.getByText(/אני המדריך המקומי שלך לאוזורה/i)).toBeInTheDocument();
  });

  it('should respond with map navigation card when querying "מפה" or "map"', () => {
    openChat();
    submitQuery('תראה לי את המפה');
    expect(screen.getByText(/הנה מפת הפסטיבל האינטראקטיבית/i)).toBeInTheDocument();
    expect(screen.getByText('פתח מפה')).toBeInTheDocument();

    const openMapBtn = screen.getByText('פתח מפה');
    fireEvent.click(openMapBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/map');
  });

  it('should respond with My Schedule navigation card when querying "הלוח שלי"', () => {
    openChat();
    submitQuery('הלוח שלי');
    expect(screen.getByText(/הנה הלוח האישי שלך/i)).toBeInTheDocument();
    expect(screen.getByText('פתח לוח אישי')).toBeInTheDocument();

    const openScheduleBtn = screen.getByText('פתח לוח אישי');
    fireEvent.click(openScheduleBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/favorites');
  });

  it('should respond with timetable navigation card when querying "timetable" in English mode', () => {
    render(
      <MemoryRouter>
        <OfflineChatbot {...defaultProps} lang="en" />
      </MemoryRouter>
    );
    const toggleBtn = screen.getByRole('button', { name: /Toggle offline chatbot/i });
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Ask anything freely/i);
    fireEvent.change(input, { target: { value: 'show timetable' } });
    fireEvent.submit(input.closest('form'));
    
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText(/Here is the complete festival timetable/i)).toBeInTheDocument();
    expect(screen.getByText('Open Timetable')).toBeInTheDocument();

    const openTimetableBtn = screen.getByText('Open Timetable');
    fireEvent.click(openTimetableBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/timetable');
  });

  it('should respond with guide navigation card when querying "מדריך"', () => {
    openChat();
    submitQuery('מדריך');
    expect(screen.getByText(/הנה מדריך הפסטיבל המלא/i)).toBeInTheDocument();
    expect(screen.getByText('פתח מדריך')).toBeInTheDocument();
  });

  it('should respond with camping community topic when matching expanded keywords like "שכנים"', () => {
    openChat();
    submitQuery('טיפ על שכנים');
    expect(screen.getByText(/קהילה ושכנים/i)).toBeInTheDocument();
  });

  it('should respond with Astrix schedule when querying "מתי אסטריקס מנגן"', () => {
    openChat();
    submitQuery('מתי אסטריקס מנגן');
    expect(screen.getByText(/מצאתי את/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Astrix/i).length).toBeGreaterThan(0);
  });

  it('should respond with Astrix schedule when querying "when does Astrix play?" in English mode', () => {
    render(
      <MemoryRouter>
        <OfflineChatbot {...defaultProps} lang="en" />
      </MemoryRouter>
    );
    const toggleBtn = screen.getByRole('button', { name: /Toggle offline chatbot/i });
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Ask anything freely/i);
    fireEvent.change(input, { target: { value: 'when does Astrix play?' } });
    fireEvent.submit(input.closest('form'));
    
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText(/I found/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Astrix/i).length).toBeGreaterThan(0);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentChecklist from './EquipmentChecklist';

describe('EquipmentChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the shared section by default with its topics collapsed', () => {
    render(<EquipmentChecklist />);
    expect(screen.getByText('ציוד שטח (קבוצתי)')).toBeTruthy();
    expect(screen.getByText('מחסה וצל')).toBeTruthy();
    expect(screen.queryByText('אוהלים')).toBeNull();
  });

  it('expands a topic on click and shows its items', () => {
    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה וצל'));
    expect(screen.getByText('אוהלים')).toBeTruthy();
  });

  it('switches to the personal section', () => {
    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByTestId('equipment-section-toggle-personal'));
    expect(screen.getByText('ציוד אישי')).toBeTruthy();
    expect(screen.getByText('שינה')).toBeTruthy();
  });

  it('checking an item updates the topic progress count', () => {
    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה וצל'));
    expect(screen.getByTestId('equipment-topic-shelter').textContent).toContain('0/4');

    fireEvent.click(screen.getByTestId('equipment-item-shared-tents'));

    expect(screen.getByTestId('equipment-topic-shelter').textContent).toContain('1/4');
  });

  it('checked state persists across remount via localStorage', () => {
    const { unmount } = render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה וצל'));
    fireEvent.click(screen.getByTestId('equipment-item-shared-tents'));
    unmount();

    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה וצל'));
    const checkbox = screen.getByTestId('equipment-item-shared-tents').querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
  });

  it('renders an export button', () => {
    render(<EquipmentChecklist />);
    expect(screen.getByTestId('equipment-export-btn')).toBeTruthy();
  });
});

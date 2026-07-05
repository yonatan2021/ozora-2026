import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentChecklist from './EquipmentChecklist';

describe('EquipmentChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the shared section by default with its topics collapsed', () => {
    render(<EquipmentChecklist />);
    expect(screen.getByText('ציוד שטח קבוצתי')).toBeTruthy();
    expect(screen.getByText('מחסה, צל והגנה מגשם')).toBeTruthy();
    expect(screen.queryByText('אוהלים קבוצתיים או אוהל ציוד')).toBeNull();
  });

  it('expands a topic on click and shows its items', () => {
    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה, צל והגנה מגשם'));
    expect(screen.getByText('אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
  });

  it('switches to the personal section', () => {
    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByTestId('equipment-section-toggle-personal'));
    expect(screen.getByText('ציוד אישי')).toBeTruthy();
    expect(screen.getByText('שינה')).toBeTruthy();
  });

  it('checking an item updates the topic progress count', () => {
    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה, צל והגנה מגשם'));
    expect(screen.getByTestId('equipment-topic-shelter').textContent).toContain('0/17');

    fireEvent.click(screen.getByTestId('equipment-item-shared-tents'));

    expect(screen.getByTestId('equipment-topic-shelter').textContent).toContain('1/17');
  });

  it('checked state persists across remount via localStorage', () => {
    const { unmount } = render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה, צל והגנה מגשם'));
    fireEvent.click(screen.getByTestId('equipment-item-shared-tents'));
    unmount();

    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה, צל והגנה מגשם'));
    const checkbox = screen.getByTestId('equipment-item-shared-tents').querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
  });

  it('renders an export button', () => {
    render(<EquipmentChecklist />);
    expect(screen.getByTestId('equipment-export-btn')).toBeTruthy();
  });

  it('renders the info note explaining how to export', () => {
    render(<EquipmentChecklist />);
    expect(screen.getByText(/לאחר סימון הציוד/i)).toBeTruthy();
  });

  it('shows quantity and note fields for equipment that needs planning detail', () => {
    render(<EquipmentChecklist />);
    fireEvent.click(screen.getByText('מחסה, צל והגנה מגשם'));

    expect(screen.getByLabelText('כמות עבור אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
    expect(screen.getByLabelText('הערה עבור אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
  });

  it('filters items based on search query matching item label or hint', async () => {
    render(<EquipmentChecklist />);
    
    // Type a query that matches specific items but not topic headings
    const searchInput = screen.getByPlaceholderText('חיפוש פריט או רמז עזר...');
    fireEvent.change(searchInput, { target: { value: 'שלט זיהוי' } });

    // The topic containing 'שלט זיהוי למחנה' should be displayed and auto-expanded
    const highlight = await screen.findByText('שלט זיהוי');
    expect(highlight.tagName).toBe('MARK');
    expect(highlight.parentElement.textContent).toBe('שלט זיהוי למחנה');
    
    // Items that don't match should not be present
    expect(screen.queryByText('רשימת אחראים על ציוד קבוצתי')).toBeNull();
  });

  it('displays all items of a topic if the topic heading matches the search query', async () => {
    render(<EquipmentChecklist />);
    
    const searchInput = screen.getByPlaceholderText('חיפוש פריט או רמז עזר...');
    fireEvent.change(searchInput, { target: { value: 'מחסה' } }); // Matches 'מחסה, צל והגנה מגשם'

    // The items inside this topic should be shown since the heading matched
    expect(await screen.findByText('אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
    expect(screen.getByText('קנופי או גזיבו קבוצתי')).toBeTruthy();
  });

  it('filters items based on status chips (checked/unchecked/all)', () => {
    render(<EquipmentChecklist />);
    
    // Expand shelter topic
    fireEvent.click(screen.getByText('מחסה, צל והגנה מגשם'));
    
    // Check 'אוהלים קבוצתיים או אוהל ציוד'
    fireEvent.click(screen.getByTestId('equipment-item-shared-tents'));

    // Filter by 'checked' (סומנו)
    fireEvent.click(screen.getByText('סומנו'));
    expect(screen.queryByText('אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
    expect(screen.queryByText('קנופי או גזיבו קבוצתי')).toBeNull();

    // Filter by 'unchecked' (טרם סומנו)
    fireEvent.click(screen.getByText('טרם סומנו'));
    expect(screen.queryByText('אוהלים קבוצתיים או אוהל ציוד')).toBeNull();
    expect(screen.queryByText('קנופי או גזיבו קבוצתי')).toBeTruthy();

    // Filter by 'all' (הכל)
    fireEvent.click(screen.getByText('הכל'));
    expect(screen.queryByText('אוהלים קבוצתיים או אוהל ציוד')).toBeTruthy();
    expect(screen.queryByText('קנופי או גזיבו קבוצתי')).toBeTruthy();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useEquipmentChecklist from './useEquipmentChecklist';

describe('useEquipmentChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no items checked', () => {
    const { result } = renderHook(() => useEquipmentChecklist());
    expect(result.current.isChecked('shared-tents')).toBe(false);
  });

  it('toggles an item and persists to localStorage', () => {
    const { result } = renderHook(() => useEquipmentChecklist());

    act(() => {
      result.current.toggle('shared-tents');
    });

    expect(result.current.isChecked('shared-tents')).toBe(true);
    expect(JSON.parse(localStorage.getItem('ozora_equipment_checklist'))).toEqual({
      'shared-tents': true
    });
  });

  it('toggling twice returns to unchecked', () => {
    const { result } = renderHook(() => useEquipmentChecklist());

    act(() => {
      result.current.toggle('shared-tents');
    });
    act(() => {
      result.current.toggle('shared-tents');
    });

    expect(result.current.isChecked('shared-tents')).toBe(false);
  });

  it('loads previously saved state from localStorage', () => {
    localStorage.setItem('ozora_equipment_checklist', JSON.stringify({ 'personal-mattress': true }));

    const { result } = renderHook(() => useEquipmentChecklist());

    expect(result.current.isChecked('personal-mattress')).toBe(true);
    expect(result.current.isChecked('shared-tents')).toBe(false);
  });

  it('computes topic progress', () => {
    const { result } = renderHook(() => useEquipmentChecklist());
    const topic = { items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };

    act(() => {
      result.current.toggle('a');
      result.current.toggle('b');
    });

    expect(result.current.getTopicProgress(topic)).toEqual({ done: 2, total: 3 });
  });

  it('computes section progress across multiple topics', () => {
    const { result } = renderHook(() => useEquipmentChecklist());
    const section = {
      topics: [
        { items: [{ id: 'a' }, { id: 'b' }] },
        { items: [{ id: 'c' }] }
      ]
    };

    act(() => {
      result.current.toggle('a');
      result.current.toggle('c');
    });

    expect(result.current.getSectionProgress(section)).toEqual({ done: 2, total: 3 });
  });

  it('imports a checked map and replaces current state', () => {
    const { result } = renderHook(() => useEquipmentChecklist());
    act(() => {
      result.current.toggle('shared-tents');
    });
    expect(result.current.isChecked('shared-tents')).toBe(true);

    act(() => {
      result.current.importCheckedMap({ 'personal-mattress': true });
    });

    expect(result.current.isChecked('shared-tents')).toBe(false);
    expect(result.current.isChecked('personal-mattress')).toBe(true);
  });
});

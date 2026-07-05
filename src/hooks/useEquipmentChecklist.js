import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ozora_equipment_checklist';

function normalizeItemState(value) {
  if (value === true || value === false) {
    return { checked: value, quantity: '', note: '' };
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      checked: !!value.checked,
      quantity: value.quantity == null ? '' : String(value.quantity),
      note: typeof value.note === 'string' ? value.note : ''
    };
  }

  return { checked: false, quantity: '', note: '' };
}

function normalizeChecklistState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).map(([itemId, itemState]) => [itemId, normalizeItemState(itemState)])
  );
}

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeChecklistState(JSON.parse(saved)) : {};
  } catch {
    return {};
  }
}

export default function useEquipmentChecklist() {
  const [checked, setChecked] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const getItemDetails = useCallback((itemId) => normalizeItemState(checked[itemId]), [checked]);

  const isChecked = useCallback((itemId) => getItemDetails(itemId).checked, [getItemDetails]);

  const toggle = useCallback((itemId) => {
    setChecked(prev => {
      const current = normalizeItemState(prev[itemId]);
      return { ...prev, [itemId]: { ...current, checked: !current.checked } };
    });
  }, []);

  const setQuantity = useCallback((itemId, quantity) => {
    setChecked(prev => {
      const current = normalizeItemState(prev[itemId]);
      return { ...prev, [itemId]: { ...current, quantity } };
    });
  }, []);

  const setNote = useCallback((itemId, note) => {
    setChecked(prev => {
      const current = normalizeItemState(prev[itemId]);
      return { ...prev, [itemId]: { ...current, note } };
    });
  }, []);

  const getTopicProgress = useCallback((topic) => {
    const total = topic.items.length;
    const done = topic.items.filter(item => checked[item.id]).length;
    return { done, total };
  }, [checked]);

  const getSectionProgress = useCallback((section) => {
    const allItems = section.topics.flatMap(t => t.items);
    const total = allItems.length;
    const done = allItems.filter(item => checked[item.id]).length;
    return { done, total };
  }, [checked]);

  const importCheckedMap = useCallback((newMap) => {
    setChecked(normalizeChecklistState(newMap));
  }, []);

  return {
    isChecked,
    getItemDetails,
    toggle,
    setQuantity,
    setNote,
    getTopicProgress,
    getSectionProgress,
    checkedMap: checked,
    importCheckedMap
  };
}

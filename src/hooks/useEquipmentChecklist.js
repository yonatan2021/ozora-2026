import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ozora_equipment_checklist';

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export default function useEquipmentChecklist() {
  const [checked, setChecked] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const isChecked = useCallback((itemId) => !!checked[itemId], [checked]);

  const toggle = useCallback((itemId) => {
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }));
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

  return { isChecked, toggle, getTopicProgress, getSectionProgress, checkedMap: checked };
}

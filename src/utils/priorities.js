const STORAGE_KEY = 'ozora_priorities';

export const PRIORITY_ORDER = ['must', 'want', 'maybe'];
const PRIORITY_CYCLE = { must: 'want', want: 'maybe', maybe: null };

function loadPriorities() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePriorities(priorities) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(priorities));
}

export function getPriorities() {
  return loadPriorities();
}

export function getPriority(setKey) {
  return loadPriorities()[setKey] || null;
}

export function cyclePriority(setKey) {
  const priorities = loadPriorities();
  const current = priorities[setKey] || null;

  if (current === null) {
    priorities[setKey] = 'must';
  } else {
    const next = PRIORITY_CYCLE[current];
    if (next) {
      priorities[setKey] = next;
    } else {
      delete priorities[setKey];
    }
  }

  savePriorities(priorities);
  return priorities[setKey] || null;
}

export function prioritySortValue(setKey, priorities) {
  const p = priorities[setKey];
  if (p === 'must') return 0;
  if (p === 'want') return 1;
  if (p === 'maybe') return 2;
  return 1;
}

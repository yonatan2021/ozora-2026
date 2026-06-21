const STORAGE_KEY = 'ozora_notes';
const MAX_LENGTH = 100;

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getNotes() {
  return loadNotes();
}

export function getNote(setKey) {
  return loadNotes()[setKey] || '';
}

export function setNote(setKey, text) {
  const notes = loadNotes();
  const trimmed = text.slice(0, MAX_LENGTH);
  if (trimmed) {
    notes[setKey] = trimmed;
  } else {
    delete notes[setKey];
  }
  saveNotes(notes);
  return notes;
}

export { MAX_LENGTH as NOTE_MAX_LENGTH };

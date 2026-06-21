// Parse 'YYYY-MM-DD HH:mm' into Date object
export function parseSetDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

// Calculate if simulated date/time falls within a set duration
export function getSetStatus(set, simDateTime) {
  const startObj = parseSetDateTime(set.date, set.start);
  let endObj = parseSetDateTime(set.date, set.end);

  // If the set wraps past midnight
  if (set.endsNextDay || set.end < set.start) {
    endObj.setDate(endObj.getDate() + 1);
  }

  if (simDateTime >= startObj && simDateTime < endObj) {
    return 'active';
  } else if (simDateTime < startObj) {
    return 'future';
  } else {
    return 'past';
  }
}

// Generate a stable composite key for a set
export function getSetUniqueKey(set) {
  return `${set.artist}::${set.stage}::${set.date}::${set.start}`;
}

// Migrate legacy 'set-X' IDs to stable composite keys
export function migrateFavorites(savedFavs, timetableData) {
  if (!Array.isArray(savedFavs)) return [];
  return savedFavs.map(fav => {
    if (typeof fav === 'string') {
      if (fav.startsWith('set-')) {
        const matchedSet = timetableData.find(s => s.id === fav);
        return matchedSet ? getSetUniqueKey(matchedSet) : null;
      }
      const exists = timetableData.some(s => getSetUniqueKey(s) === fav);
      return exists ? fav : null;
    }
    return null;
  }).filter(Boolean);
}

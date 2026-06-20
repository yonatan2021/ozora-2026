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

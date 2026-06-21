import { parseSetDateTime } from './time';

export function detectConflicts(favSets) {
  const conflicts = [];

  for (let i = 0; i < favSets.length; i++) {
    for (let j = i + 1; j < favSets.length; j++) {
      const a = favSets[i];
      const b = favSets[j];

      if (a.date !== b.date && !setsSpanSameNight(a, b)) continue;

      const aStart = parseSetDateTime(a.date, a.start);
      let aEnd = parseSetDateTime(a.date, a.end);
      if (a.endsNextDay || a.end < a.start) {
        aEnd.setDate(aEnd.getDate() + 1);
      }

      const bStart = parseSetDateTime(b.date, b.start);
      let bEnd = parseSetDateTime(b.date, b.end);
      if (b.endsNextDay || b.end < b.start) {
        bEnd.setDate(bEnd.getDate() + 1);
      }

      if (aStart < bEnd && bStart < aEnd) {
        const overlapStart = Math.max(aStart.getTime(), bStart.getTime());
        const overlapEnd = Math.min(aEnd.getTime(), bEnd.getTime());
        const overlapMinutes = Math.round((overlapEnd - overlapStart) / 60000);

        if (overlapMinutes > 0) {
          conflicts.push({ setA: a, setB: b, overlapMinutes });
        }
      }
    }
  }

  return conflicts;
}

function setsSpanSameNight(a, b) {
  const aDate = new Date(a.date);
  const bDate = new Date(b.date);
  const diffDays = Math.abs(aDate.getTime() - bDate.getTime()) / 86400000;
  if (diffDays !== 1) return false;

  const earlier = aDate < bDate ? a : b;
  return earlier.endsNextDay || earlier.end < earlier.start;
}

export function getConflictsForSet(setId, conflicts) {
  return conflicts.filter(c => c.setA.id === setId || c.setB.id === setId);
}

export function getConflictPartner(setId, conflict) {
  return conflict.setA.id === setId ? conflict.setB : conflict.setA;
}

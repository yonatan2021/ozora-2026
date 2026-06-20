import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('OZORA_2026_Timetable/All Sets-טבלה 1.csv');
const outputPath = path.resolve('src/data/timetable.json');

const content = fs.readFileSync(csvPath, 'utf-8');
// Split by lines, handle CRLF/LF
const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const headers = lines[0].split(',');

const sets = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  
  // Custom CSV cell parser to handle quotes & commas correctly
  let row = [];
  let insideQuote = false;
  let entry = '';
  for (let char of line) {
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      row.push(entry.trim());
      entry = '';
    } else {
      entry += char;
    }
  }
  row.push(entry.trim());

  if (row.length < headers.length) continue;

  const [date, weekday, day, stage, start, end, plus1d, artist, type] = row;
  if (!artist || !stage) continue;

  sets.push({
    id: `set-${i}`,
    date,
    weekday,
    day: day || (date === '2026-07-25' ? 'Warmup Sat' : 'Warmup Sun'),
    stage,
    start,
    end,
    endsNextDay: plus1d === '+1',
    artist,
    type
  });
}

// Ensure output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(sets, null, 2), 'utf-8');
console.log(`Parsed ${sets.length} sets successfully.`);

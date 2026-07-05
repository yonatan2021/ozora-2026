import fs from 'fs';
import { searchSchedule } from './search.js';

const timetableData = JSON.parse(fs.readFileSync('../data/timetable.json', 'utf8'));

const results = searchSchedule('Astrix', timetableData, {
  notes: {},
  friends: {},
  favorites: [],
  priorities: {},
  lang: 'he'
});

console.log(`Search returned ${results.length} results.`);
results.slice(0, 10).forEach(r => {
  console.log(`- Artist: ${r.artist} | Stage: ${r.stage} | Reason: ${JSON.stringify(r.matchReason)}`);
});

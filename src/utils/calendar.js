export function getCalendarPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isMacTouch = /Macintosh/.test(ua) && 'ontouchend' in document;
  return (isIOS || isMacTouch) ? 'apple' : 'google';
}

function toCalendarDateStr(date, time) {
  const [h, m] = time.split(':');
  return date.replace(/-/g, '') + 'T' + h + m + '00';
}

function getEndDate(set) {
  if (set.endsNextDay) {
    const d = new Date(set.date);
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return set.date;
}

export function generateGoogleCalendarUrl(set) {
  const startStr = toCalendarDateStr(set.date, set.start);
  const endStr = toCalendarDateStr(getEndDate(set), set.end);
  const title = `${set.artist} @ ${set.stage} - Ozora 2026`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    location: 'Ozora Festival, Hungary',
    details: set.type || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICSFile(set) {
  const dtStart = toCalendarDateStr(set.date, set.start);
  const dtEnd = toCalendarDateStr(getEndDate(set), set.end);
  const summary = `${set.artist} @ ${set.stage}`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ozora 2026//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    'LOCATION:Ozora Festival\\, Hungary',
    `DESCRIPTION:${set.type || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${set.artist.replace(/[^a-zA-Z0-9]/g, '_')}_ozora2026.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

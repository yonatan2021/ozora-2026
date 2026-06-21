import { useState, useEffect } from 'react';

const GATES_OPEN = new Date('2026-07-24T12:00:00+02:00').getTime();

export default function CountdownBanner({ lang }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = GATES_OPEN - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const label = lang === 'he' ? 'פתיחת שערים' : 'Gates Open';
  const dateLabel = lang === 'he' ? 'יום שישי 24/7 · 12:00' : 'Friday 24/7 · 12:00';

  return (
    <div className="countdown-banner">
      <div className="countdown-label">
        <span className="countdown-title">{label}</span>
        <span className="countdown-date">{dateLabel}</span>
      </div>
      <div className="countdown-units">
        <CountdownUnit value={days} label={lang === 'he' ? 'ימים' : 'days'} />
        <span className="countdown-sep">:</span>
        <CountdownUnit value={hours} label={lang === 'he' ? 'שעות' : 'hrs'} />
        <span className="countdown-sep">:</span>
        <CountdownUnit value={minutes} label={lang === 'he' ? 'דקות' : 'min'} />
        <span className="countdown-sep">:</span>
        <CountdownUnit value={seconds} label={lang === 'he' ? 'שניות' : 'sec'} />
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <div className="countdown-unit">
      <span className="countdown-value">{String(value).padStart(2, '0')}</span>
      <span className="countdown-unit-label">{label}</span>
    </div>
  );
}

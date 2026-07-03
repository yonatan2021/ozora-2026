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
      <div className="countdown-glow-effect"></div>
      <div className="countdown-content">
        <div className="countdown-header-info">
          <div className="countdown-geo-container">
            <svg className="countdown-geo-svg" viewBox="0 0 100 100" width="28" height="28" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
              <polygon points="50,15 80,70 20,70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
              <polygon points="50,85 80,30 20,30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
              <circle cx="50" cy="50" r="4" fill="currentColor" className="geo-center-pulse" />
            </svg>
          </div>
          <div className="countdown-text">
            <span className="countdown-title">{label}</span>
            <span className="countdown-date">{dateLabel}</span>
          </div>
        </div>

        <div className="countdown-divider"></div>

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

import { Clock, RefreshCw, Radio } from 'lucide-react';
import { translations } from '../utils/lang';
import { trackEvent } from '../utils/analytics';

export default function TimeSimulator({ 
  lang, 
  simTime, 
  setSimTime, 
  isSimulated, 
  setIsSimulated, 
  onOpenLiveModal, 
  onScrollToActive,
  selectedDay = 'DAY 1',
  isThemeLocked = false,
  setIsThemeLocked = () => {}
}) {
  const t = translations[lang];

  // Derive active day date from selectedDay (default to 2026-07-27 if not matching)
  const dayDates = {
    'Warmup Sat': '2026-07-25',
    'Warmup Sun': '2026-07-26',
    'DAY 1': '2026-07-27',
    'DAY 2': '2026-07-28',
    'DAY 3': '2026-07-29',
    'DAY 4': '2026-07-30',
    'DAY 5': '2026-07-31',
    'DAY 6': '2026-08-01',
    'DAY 7': '2026-08-02',
    'DAY 8': '2026-08-03'
  };
  const activeDateStr = dayDates[selectedDay] || '2026-07-27';
  
  // Scoped from 00:00 to 23:59:59 of that specific day
  const minTimestamp = new Date(`${activeDateStr}T00:00:00`).getTime();
  const maxTimestamp = new Date(`${activeDateStr}T23:59:59`).getTime();
  const stepMs = 30 * 60 * 1000; // 30 minutes step

  const formatDate = (ts) => {
    const date = new Date(ts);
    return date.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const bgStyle = {
    background: 'linear-gradient(135deg, var(--surface) 0%, var(--simulator-tint) 100%)',
    transition: 'background 0.5s ease'
  };

  return (
    <div className="time-simulator" style={bgStyle}>
      <div className="simulator-header">
        <div className="simulator-title">
          <Clock size={18} className={isSimulated ? 'pulse-green' : ''} />
          <span>{isSimulated ? t.simulatingTime : (lang === 'he' ? 'זמן אמת (מדמה פסטיבל)' : 'Real Time (Festival Sim)')}</span>
        </div>
        <button 
          className="reset-time-btn" 
          onClick={() => {
            const nextSim = !isSimulated;
            setIsSimulated(nextSim);
            if (nextSim) {
              // Initialize to the middle of festival (e.g. DAY 2 Mon 27 Jul 20:00) for standard demo
              setSimTime(new Date('2026-07-27T20:00:00').getTime());
            }
          }}
        >
          <RefreshCw size={14} />
          <span>{isSimulated ? t.backToRealTime : (lang === 'he' ? 'הדמיית פסטיבל' : 'Simulate Festival')}</span>
        </button>
        <button 
          type="button"
          className={`theme-lock-btn ${isThemeLocked ? 'locked' : ''}`}
          onClick={() => setIsThemeLocked(!isThemeLocked)}
          title={lang === 'he' ? 'נעל צבעים / ערכת נושא' : 'Lock Colors / Theme'}
        >
          <span>{isThemeLocked ? (lang === 'he' ? '🔓 שחרר צבעים' : '🔓 Unlock Colors') : (lang === 'he' ? '🔒 נעל צבעים' : '🔒 Lock Colors')}</span>
        </button>
      </div>

      {isSimulated && (
        <div className="simulator-controls">
          <input 
            type="range" 
            min={minTimestamp} 
            max={maxTimestamp} 
            step={stepMs} 
            value={simTime} 
            onChange={(e) => setSimTime(Number(e.target.value))}
            onMouseUp={(e) => trackEvent('change_sim_time', { simulated_time: formatDate(Number(e.target.value)) })}
            onTouchEnd={(e) => trackEvent('change_sim_time', { simulated_time: formatDate(Number(e.target.value)) })}
            className="time-slider"
          />
          <div className="simulator-details-row">
            <div className="time-display">{formatDate(simTime)}</div>
            <div className="simulator-actions">
              <button 
                className="scroll-to-time-btn"
                onClick={() => {
                  trackEvent('simulator_take_me_there');
                  onScrollToActive?.();
                }}
                title={lang === 'he' ? 'גלול לשעה הנבחרת בלוח' : 'Scroll to selected time in schedule'}
              >
                {lang === 'he' ? 'קח אותי לשם' : 'Take Me There'}
              </button>
              <button 
                className="open-live-status-btn"
                onClick={() => {
                  trackEvent('view_live_status_board');
                  onOpenLiveModal?.();
                }}
              >
                <Radio size={14} className="live-radio-icon" />
                <span>{lang === 'he' ? '?מה מנגן עכשיו' : "What's Playing Now?"}</span>
              </button>
            </div>
          </div>
          <p className="sim-desc">{t.simulatedTimeDesc}</p>
        </div>
      )}
    </div>
  );
}

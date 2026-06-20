import { useEffect } from 'react';
import { Star } from 'lucide-react';

const STAGES = [
  "OZORA STAGE",
  "PUMPUI",
  "THE DOME",
  "DRAGON NEST / COOKING GROOVE",
  "VISIUM GARDEN",
  "TEK ZERO (2000s Trance)"
];

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function TimetableGrid({ sets, favorites, toggleFavorite, onSetClick, activeStatusMap, simTime, isSimulated }) {
  // Calculate current time indicator offset if simulated or active
  const evalDate = new Date(simTime);

  const evalDateStr = evalDate.getFullYear() + '-' + String(evalDate.getMonth() + 1).padStart(2, '0') + '-' + String(evalDate.getDate()).padStart(2, '0');
  const isCurrentDay = sets.length > 0 && sets[0].date === evalDateStr;
  
  const currentHour = evalDate.getHours();
  const currentMinute = evalDate.getMinutes();
  const minuteOffset = currentMinute % 30; // 0 to 29
  const percentOffset = (minuteOffset / 30) * 100;

  // Generate time slots: 00:00 to 23:30 in 30-min intervals
  const timeSlots = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    timeSlots.push(`${hh}:00`);
    timeSlots.push(`${hh}:30`);
  }

  // To check if a slot is covered by a running set (so we avoid double rendering)
  const isSlotCovered = (stage, slot) => {
    return sets.some(s => {
      if (s.stage !== stage) return false;
      if (s.start === slot) return false; // This is the start cell itself

      const [sh, sm] = s.start.split(':').map(Number);
      let [eh, em] = s.end.split(':').map(Number);
      const [slh, slm] = slot.split(':').map(Number);

      const sMin = sh * 60 + sm;
      let eMin = eh * 60 + em;
      const slMin = slh * 60 + slm;

      if (s.endsNextDay || eMin < sMin) {
        eMin += 24 * 60;
      }

      // If the current slot is in the future relative to the start slot
      // e.g. slot is 01:00, start is 23:30 (+1d), slMin is 60, sMin is 1410.
      // Since it ends next day, slMin is treated as slMin + 24*60 = 1500.
      // 1500 >= 1410 && 1500 < eMin.
      if (s.endsNextDay && slMin < sMin) {
        const adjustedSlMin = slMin + 24 * 60;
        return adjustedSlMin > sMin && adjustedSlMin < eMin;
      }

      return slMin > sMin && slMin < eMin;
    });
  };

  return (
    <div className="grid-view-wrapper">
      <div className="grid-table">
        <div className="grid-header-row">
          <div className="time-col-header">Time</div>
          {STAGES.map(stage => (
            <div key={stage} className={`stage-col-header ${STAGE_CLASSES[stage]}`}>
              {stage}
            </div>
          ))}
        </div>

        {timeSlots.map(slot => {
          const [slotHourStr, slotMinuteStr] = slot.split(':');
          const slotHour = Number(slotHourStr);
          const slotMinute = Number(slotMinuteStr);
          const isTargetSlot = isCurrentDay && slotHour === currentHour && (slotMinute === 0 ? currentMinute < 30 : currentMinute >= 30);

          return (
            <div key={slot} className="grid-row">
              {isTargetSlot && (
                <div 
                  className="grid-time-indicator" 
                  style={{ top: `${percentOffset}%` }}
                >
                  <div className="grid-time-indicator-line"></div>
                  <div className="grid-time-indicator-badge">
                    {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
                  </div>
                </div>
              )}
              <div className="time-cell">{slot}</div>
            {STAGES.map(stage => {
              // 1. Check if slot is covered by a spanning set card (rendered in an earlier row)
              if (isSlotCovered(stage, slot)) {
                return null; // Skip rendering cell to let grid-row-end span it
              }

              // 2. Find if a set starts at this exact slot
              const activeSet = sets.find(s => s.stage === stage && s.start === slot);

              if (!activeSet) {
                return <div key={stage} className="grid-cell empty"></div>;
              }

              // 3. Calculate grid span duration in half-hour intervals
              const [sh, sm] = activeSet.start.split(':').map(Number);
              let [eh, em] = activeSet.end.split(':').map(Number);
              
              if (activeSet.endsNextDay || eh * 60 + em < sh * 60 + sm) {
                eh += 24;
              }
              const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
              const spanSlots = Math.max(1, Math.round(durationMinutes / 30));

              const isFav = favorites.includes(activeSet.id);
              const status = activeStatusMap[activeSet.id] || '';

              const isPlaying = status === 'active';

              return (
                <div 
                  key={stage} 
                  id={`set-card-${activeSet.id}`}
                  className={`grid-cell set-card ${STAGE_CLASSES[stage]} ${status} stagger-slide-up`}
                  style={{ 
                    gridRow: `span ${spanSlots}`,
                    '--card-index': spanSlots > 2 ? 1 : 2
                  }}
                  onClick={() => onSetClick(activeSet)}
                >
                  <div className="set-card-header">
                    <span className="set-time">{activeSet.start} - {activeSet.end}</span>
                    
                    {isPlaying && (
                      <div className="live-wave-indicator" title="Live Now">
                        <span className="wave-bar bar-1"></span>
                        <span className="wave-bar bar-2"></span>
                        <span className="wave-bar bar-3"></span>
                      </div>
                    )}

                    <button 
                      className="fav-star-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(activeSet.id);
                      }}
                    >
                      <Star size={12} fill={isFav ? 'var(--stage-visium)' : 'none'} stroke={isFav ? 'var(--stage-visium)' : 'currentColor'} />
                    </button>
                  </div>
                  <div className="set-artist" title={activeSet.artist}>{activeSet.artist}</div>
                  <div className="set-type">{activeSet.type}</div>
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
}

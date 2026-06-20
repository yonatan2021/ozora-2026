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

const HOUR_HEIGHT = 80;
const TOTAL_HOURS = 24;
const GRID_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getCardStyle(set) {
  const startMin = timeToMinutes(set.start);
  const endMin = timeToMinutes(set.end);

  let durationMin;
  if (set.endsNextDay || endMin <= startMin) {
    durationMin = (24 * 60) - startMin;
  } else {
    durationMin = endMin - startMin;
  }

  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = (durationMin / 60) * HOUR_HEIGHT;

  return {
    position: 'absolute',
    top: `${top}px`,
    height: `${height}px`,
    left: '4px',
    right: '4px',
  };
}

export default function TimetableGrid({ sets, favorites, toggleFavorite, onSetClick, activeStatusMap, simTime, isSimulated }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const indicator = document.querySelector('.grid-time-indicator');
      if (indicator) {
        indicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const firstCard = document.querySelector('.grid-table-v2 .set-card');
      if (firstCard) {
        firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [simTime, isSimulated]);

  const evalDate = new Date(simTime);
  const evalDateStr = evalDate.getFullYear() + '-' + String(evalDate.getMonth() + 1).padStart(2, '0') + '-' + String(evalDate.getDate()).padStart(2, '0');
  const isCurrentDay = sets.length > 0 && sets[0].date === evalDateStr;

  const currentTotalMinutes = evalDate.getHours() * 60 + evalDate.getMinutes();
  const indicatorTop = (currentTotalMinutes / 60) * HOUR_HEIGHT;

  const hourLabels = Array.from({ length: TOTAL_HOURS }, (_, i) => String(i).padStart(2, '0') + ':00');

  const setsByStage = {};
  STAGES.forEach(stage => {
    setsByStage[stage] = sets.filter(s => s.stage === stage);
  });

  return (
    <div className="grid-view-wrapper">
      <div className="grid-table-v2">
        {/* Sticky Header */}
        <div className="grid-header-row">
          <div className="time-col-header">Time</div>
          {STAGES.map(stage => (
            <div key={stage} className={`stage-col-header ${STAGE_CLASSES[stage]}`}>
              {stage}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="grid-body" style={{ height: `${GRID_HEIGHT}px` }}>
          {/* Time Labels */}
          <div className="grid-time-labels">
            {hourLabels.map((label, i) => (
              <div
                key={label}
                className="grid-hour-label"
                style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Stage Columns */}
          {STAGES.map((stage, stageIdx) => (
            <div key={stage} className="grid-stage-column" style={{ gridColumn: stageIdx + 2, gridRow: 1 }}>
              {setsByStage[stage].map(set => {
                const isFav = favorites.includes(set.id);
                const status = activeStatusMap[set.id] || '';
                const isPlaying = status === 'active';
                const cardStyle = getCardStyle(set);
                const heightNum = parseFloat(cardStyle.height);
                const isCompact = heightNum < HOUR_HEIGHT;

                return (
                  <div
                    key={set.id}
                    id={`set-card-${set.id}`}
                    className={`set-card ${STAGE_CLASSES[set.stage]} ${status} stagger-slide-up`}
                    style={{ ...cardStyle, '--card-index': 1 }}
                    onClick={() => onSetClick(set)}
                  >
                    <div className="set-card-header">
                      <span className="set-time">
                        {set.start} - {set.end}{set.endsNextDay ? ' (+1d)' : ''}
                      </span>

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
                          toggleFavorite(set.id);
                        }}
                      >
                        <Star size={12} fill={isFav ? 'var(--stage-visium)' : 'none'} stroke={isFav ? 'var(--stage-visium)' : 'currentColor'} />
                      </button>
                    </div>
                    <div className="set-artist" title={set.artist}>{set.artist}</div>
                    {!isCompact && <div className="set-type">{set.type}</div>}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Hour grid lines */}
          {hourLabels.map((_, i) => (
            <div
              key={`line-${i}`}
              className="grid-hour-line"
              style={{ top: `${i * HOUR_HEIGHT}px` }}
            />
          ))}

          {/* Current Time Indicator */}
          {isCurrentDay && (
            <div className="grid-time-indicator" style={{ top: `${indicatorTop}px` }}>
              <div className="grid-time-indicator-line"></div>
              <div className="grid-time-indicator-badge">
                {String(evalDate.getHours()).padStart(2, '0')}:{String(evalDate.getMinutes()).padStart(2, '0')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

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

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function TimetableGrid({ lang, sets, favorites, toggleFavorite, onSetClick, activeStatusMap, simTime, days, selectedDay, onDayChange, dayLabels }) {
  const isHe = lang === 'he';
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  const navigateToDay = (day) => {
    onDayChange(day);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const layout = useMemo(() => {
    const evalDate = new Date(simTime);
    const evalDateStr = evalDate.getFullYear() + '-' + String(evalDate.getMonth() + 1).padStart(2, '0') + '-' + String(evalDate.getDate()).padStart(2, '0');
    const isCurrentDay = sets.length > 0 && sets[0].date === evalDateStr;
    const currentTotalMinutes = evalDate.getHours() * 60 + evalDate.getMinutes();
    const simHour = evalDate.getHours();

    // 1. Filter stages that have scheduled performances on this day
    const activeStages = STAGES.filter(stage => sets.some(s => s.stage === stage));

    // 2. Identify active hours (overlapping with sets or the current simulated hour)
    const isHourActive = Array(24).fill(false);
    sets.forEach(set => {
      const startMin = timeToMinutes(set.start);
      const endMin = set.endsNextDay || timeToMinutes(set.end) <= startMin
        ? 24 * 60
        : timeToMinutes(set.end);
      for (let h = 0; h < 24; h++) {
        const hStart = h * 60;
        const hEnd = (h + 1) * 60;
        if (startMin < hEnd && endMin > hStart) {
          isHourActive[h] = true;
        }
      }
    });
    if (isCurrentDay) {
      isHourActive[simHour] = true;
    }

    // 3. Find gaps of 2+ hours and determine hour heights
    const hourHeights = Array(24).fill(HOUR_HEIGHT);
    const gaps = [];
    let inGap = false;
    let gapStart = 0;

    for (let h = 0; h < 24; h++) {
      if (!isHourActive[h]) {
        if (!inGap) {
          inGap = true;
          gapStart = h;
        }
      } else {
        if (inGap) {
          inGap = false;
          const gapLen = h - gapStart;
          if (gapLen >= 2) {
            gaps.push({ startHour: gapStart, endHour: h });
            for (let gh = gapStart; gh < h; gh++) {
              hourHeights[gh] = 50 / gapLen;
            }
          }
        }
      }
    }
    if (inGap) {
      const gapLen = 24 - gapStart;
      if (gapLen >= 2) {
        gaps.push({ startHour: gapStart, endHour: 24 });
        for (let gh = gapStart; gh < 24; gh++) {
          hourHeights[gh] = 50 / gapLen;
        }
      }
    }

    // 4. Calculate cumulative hour offsets
    const hourOffsets = [0];
    for (let h = 0; h < 24; h++) {
      hourOffsets.push(hourOffsets[h] + hourHeights[h]);
    }
    const gridHeight = hourOffsets[24];

    function getY(minutes) {
      const hour = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hour >= 24) return hourOffsets[24];
      const baseOffset = hourOffsets[hour];
      const hourHeight = hourHeights[hour];
      return baseOffset + (mins / 60) * hourHeight;
    }

    const indicatorTop = getY(currentTotalMinutes);
    const setsByStage = {};
    activeStages.forEach(stage => {
      setsByStage[stage] = sets.filter(s => s.stage === stage);
    });

    return {
      activeStages,
      evalDate,
      gaps,
      getY,
      gridHeight,
      hourHeights,
      hourOffsets,
      indicatorTop,
      isCurrentDay,
      setsByStage
    };
  }, [sets, simTime]);

  function getCardStyleLocal(set) {
    const startMin = timeToMinutes(set.start);
    const endMin = timeToMinutes(set.end);

    let durationMin;
    if (set.endsNextDay || endMin <= startMin) {
      durationMin = (24 * 60) - startMin;
    } else {
      durationMin = endMin - startMin;
    }

    const top = layout.getY(startMin);
    const bottom = layout.getY(startMin + durationMin);
    const height = bottom - top;

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '4px',
      right: '4px',
    };
  }

  return (
    <>
    <div className="grid-view-wrapper">
      <div className="grid-timezone-note">
        {isHe ? '* השעות מוצגות לפי שעון הונגריה (CEST)' : '* Times shown in Hungary timezone (CEST)'}
      </div>
      <div className="grid-table-v2" style={{ minWidth: `${80 + layout.activeStages.length * 190}px` }}>
        {/* Sticky Header */}
        <div className="grid-header-row" style={{ gridTemplateColumns: `80px repeat(${layout.activeStages.length}, 1fr)` }}>
          <div className="time-col-header">Time</div>
          {layout.activeStages.map(stage => (
            <div key={stage} className={`stage-col-header ${STAGE_CLASSES[stage]}`}>
              {stage}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="grid-body" style={{ height: `${layout.gridHeight}px`, gridTemplateColumns: `80px repeat(${layout.activeStages.length}, 1fr)` }}>
          {/* Time Labels */}
          <div className="grid-time-labels">
            {layout.hourOffsets.slice(0, 24).map((offset, i) => {
              const isInsideGap = layout.gaps.some(g => i > g.startHour && i < g.endHour);
              if (isInsideGap) return null;

              return (
                <div
                  key={`label-${i}`}
                  className="grid-hour-label"
                  style={{ top: `${offset}px`, height: `${layout.hourHeights[i]}px` }}
                >
                  {String(i).padStart(2, '0') + ':00'}
                </div>
              );
            })}
          </div>

          {/* Stage Columns */}
          {layout.activeStages.map((stage, stageIdx) => (
            <div key={stage} className="grid-stage-column" style={{ gridColumn: stageIdx + 2, gridRow: 1 }}>
              {layout.setsByStage[stage].map(set => {
                const isFav = favoriteIds.has(set.id);
                const status = activeStatusMap[set.id] || '';
                const isPlaying = status === 'active';
                const cardStyle = getCardStyleLocal(set);
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
          {layout.hourOffsets.slice(0, 24).map((offset, i) => {
            const isInsideGap = layout.gaps.some(g => i > g.startHour && i < g.endHour);
            if (isInsideGap) return null;

            return (
              <div
                key={`line-${i}`}
                className="grid-hour-line"
                style={{ top: `${offset}px`, left: '80px' }}
              />
            );
          })}

          {/* Render Collapsed Gap Banners */}
          {layout.gaps.map((gap, gapIdx) => {
            const top = layout.hourOffsets[gap.startHour];
            const height = layout.hourOffsets[gap.endHour] - top;
            const startStr = String(gap.startHour).padStart(2, '0') + ':00';
            const endStr = String(gap.endHour === 24 ? 0 : gap.endHour).padStart(2, '0') + ':00';
            return (
              <div
                key={`gap-${gapIdx}`}
                className="grid-collapsed-gap"
                style={{
                  position: 'absolute',
                  top: `${top}px`,
                  height: `${height}px`,
                  left: '80px',
                  right: 0,
                  zIndex: 3,
                }}
              >
                <div className="grid-collapsed-gap-content">
                  {isHe ? `אין הופעות (${startStr} - ${endStr})` : `No performances (${startStr} - ${endStr})`}
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator */}
          {layout.isCurrentDay && (
            <div className="grid-time-indicator" style={{ top: `${layout.indicatorTop}px` }}>
              <div className="grid-time-indicator-line"></div>
              <div className="grid-time-indicator-badge">
                {String(layout.evalDate.getHours()).padStart(2, '0')}:{String(layout.evalDate.getMinutes()).padStart(2, '0')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Day Navigation */}
      {days && days.length > 1 && (() => {
        const currentIndex = days.indexOf(selectedDay);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex < days.length - 1;
        return (
          <div className="grid-day-nav">
            <button
              className="grid-day-nav-btn"
              disabled={!hasPrev}
              onClick={() => { if (hasPrev) navigateToDay(days[currentIndex - 1]); }}
            >
              <ChevronRight size={18} />
              {hasPrev && <span>{dayLabels?.[days[currentIndex - 1]]?.[lang === 'he' ? 'he' : 'en'] || days[currentIndex - 1]}</span>}
            </button>
            <button
              className="grid-day-nav-btn"
              disabled={!hasNext}
              onClick={() => { if (hasNext) navigateToDay(days[currentIndex + 1]); }}
            >
              {hasNext && <span>{dayLabels?.[days[currentIndex + 1]]?.[lang === 'he' ? 'he' : 'en'] || days[currentIndex + 1]}</span>}
              <ChevronLeft size={18} />
            </button>
          </div>
        );
      })()}
    </>
  );
}

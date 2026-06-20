import { Star } from 'lucide-react';

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function ChronologicalFeed({ sets, favorites, toggleFavorite, onSetClick, activeStatusMap, simTime, isSimulated }) {
  // Sort sets chronologically by start time, and then by stage name
  const sortedSets = [...sets].sort((a, b) => {

    const timeCompare = a.start.localeCompare(b.start);
    if (timeCompare !== 0) return timeCompare;
    return a.stage.localeCompare(b.stage);
  });

  // Group sets by their start time
  const grouped = sortedSets.reduce((acc, set) => {
    if (!acc[set.start]) {
      acc[set.start] = [];
    }
    acc[set.start].push(set);
    return acc;
  }, {});

  return (
    <div className="feed-view">
      {Object.entries(grouped).map(([time, daySets]) => (
        <div key={time} className="feed-time-block">
          <div className="feed-time-header">{time}</div>
          <div className="feed-sets-list">
            {daySets.map((set, index) => {
              const isFav = favorites.includes(set.id);
              const status = activeStatusMap[set.id] || '';
              const isPlaying = status === 'active';

              return (
                <div 
                  key={set.id} 
                  id={`feed-set-${set.id}`}
                  className={`feed-set-card ${STAGE_CLASSES[set.stage]} ${status} stagger-slide-up`}
                  style={{ '--card-index': index }}
                  onClick={() => onSetClick(set)}
                >
                  <div className="feed-set-info">
                    <div className="feed-artist-name">
                      {isPlaying && (
                        <span className="live-wave-indicator">
                          <span className="wave-bar bar-1"></span>
                          <span className="wave-bar bar-2"></span>
                          <span className="wave-bar bar-3"></span>
                        </span>
                      )}
                      <span>{set.artist}</span>
                    </div>
                    <div className="feed-stage-name">
                      {set.stage} {set.type ? `• ${set.type}` : ''}
                    </div>
                    <div className="feed-time-duration">
                      {set.start} - {set.end} {set.endsNextDay ? '(+1d)' : ''}
                    </div>
                  </div>
                  <button 
                    className="feed-fav-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(set.id);
                    }}
                  >
                    <Star size={16} fill={isFav ? 'var(--stage-visium)' : 'none'} stroke={isFav ? 'var(--stage-visium)' : 'currentColor'} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

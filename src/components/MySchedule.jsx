import { Star, Radio } from 'lucide-react';
import { getSetStatus } from '../utils/time';

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function MySchedule({ 
  lang, 
  timetableData, 
  favorites, 
  toggleFavorite, 
  onSetClick, 
  simTime, 
  isSimulated 
}) {
  const isHe = lang === 'he';

  // 1. Filter timetable data by favorites only
  const favSets = timetableData.filter(set => favorites.includes(set.id));

  // 2. Evaluate current statuses of favorites
  const evalTime = isSimulated ? new Date(simTime) : new Date();
  if (!isSimulated) {
    evalTime.setFullYear(2026); // Match dataset year
  }

  const activeFavorites = [];
  const upcomingFavorites = [];

  favSets.forEach(set => {
    const status = getSetStatus(set, evalTime);
    if (status === 'active') {
      activeFavorites.push(set);
    } else if (status === 'future') {
      upcomingFavorites.push(set);
    }
  });

  // Sort upcoming favorites chronologically by start date/time
  upcomingFavorites.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.start.localeCompare(b.start);
  });

  // Sort all favorites chronologically for the full feed list
  const sortedFavs = [...favSets].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.start.localeCompare(b.start);
  });

  // Group all favorites by day
  const groupedByDay = sortedFavs.reduce((acc, set) => {
    if (!acc[set.day]) {
      acc[set.day] = [];
    }
    acc[set.day].push(set);
    return acc;
  }, {});

  if (favorites.length === 0) {
    return (
      <div className="empty-state stagger-slide-up" style={{ '--card-index': 0 }}>
        <p>
          {isHe 
            ? 'לוח הזמנים שלך ריק. לחץ על כוכב (★) בלוח ההופעות כדי להוסיף אמנים.' 
            : 'Your schedule is empty. Star (★) artists in the timetable to add them here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="my-schedule-container stagger-slide-up" style={{ '--card-index': 0 }}>
      {/* Live Status Board */}
      {(activeFavorites.length > 0 || upcomingFavorites.length > 0) && (
        <div className="live-favs-section">
          <h3>
            <Radio size={18} className="live-radio-icon" style={{ color: 'var(--primary)' }} />
            <span>{isHe ? 'מה קורה עכשיו בבמות' : 'Live Status Board'}</span>
          </h3>
          
          <div className="live-favs-grid">
            {/* Active Playing Favorites */}
            {activeFavorites.map((set, index) => (
              <div 
                key={set.id}
                className={`feed-set-card ${STAGE_CLASSES[set.stage]} active stagger-slide-up`}
                style={{ '--card-index': index + 1 }}
                onClick={() => onSetClick(set)}
              >
                <div className="feed-set-info">
                  <div className="live-now-tag" style={{ color: 'var(--primary)' }}>
                    <span className="live-wave-indicator">
                      <span className="wave-bar bar-1"></span>
                      <span className="wave-bar bar-2"></span>
                      <span className="wave-bar bar-3"></span>
                    </span>
                    <span>{isHe ? 'מנגן כרגע' : 'Now Playing'}</span>
                  </div>
                  <div className="feed-artist-name">{set.artist}</div>
                  <div className="feed-stage-name">{set.stage}</div>
                  <div className="feed-time-duration">{set.start} - {set.end}</div>
                </div>
              </div>
            ))}

            {/* Next Up Favorites (Top 2 upcoming) */}
            {upcomingFavorites.slice(0, 2).map((set, index) => (
              <div 
                key={set.id}
                className={`feed-set-card ${STAGE_CLASSES[set.stage]} stagger-slide-up`}
                style={{ '--card-index': activeFavorites.length + index + 1 }}
                onClick={() => onSetClick(set)}
              >
                <div className="feed-set-info">
                  <div className="feed-stage-name" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {isHe ? 'ההופעה הבאה שלך' : 'Next Up'}
                  </div>
                  <div className="feed-artist-name">{set.artist}</div>
                  <div className="feed-stage-name">{set.stage}</div>
                  <div className="feed-time-duration">{set.day} • {set.start}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Timeline List */}
      <div className="fav-feed-section">
        <h3>{isHe ? 'ציר הזמן שלי' : 'My Personal Timeline'}</h3>
        <div className="feed-view">
          {Object.entries(groupedByDay).map(([day, daySets]) => (
            <div key={day} className="feed-time-block">
              <div className="feed-time-header">
                {isHe ? day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון') : day}
              </div>
              <div className="feed-sets-list">
                {daySets.map((set, index) => {
                  const status = getSetStatus(set, evalTime);
                  return (
                    <div 
                      key={set.id} 
                      className={`feed-set-card ${STAGE_CLASSES[set.stage]} ${status} stagger-slide-up`}
                      style={{ '--card-index': index }}
                      onClick={() => onSetClick(set)}
                    >
                      <div className="feed-set-info">
                        <div className="feed-artist-name">{set.artist}</div>
                        <div className="feed-stage-name">{set.stage} {set.type ? `• ${set.type}` : ''}</div>
                        <div className="feed-time-duration">{set.start} - {set.end}</div>
                      </div>
                      <button 
                        className="feed-fav-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(set.id);
                        }}
                      >
                        <Star size={16} fill="var(--stage-visium)" stroke="var(--stage-visium)" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

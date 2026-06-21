import { useState, useEffect } from 'react';
import { Star, Radio, Share2, Flame, StarOff, Filter, MessageSquare, AlertTriangle } from 'lucide-react';
import { getSetStatus, getSetUniqueKey } from '../utils/time';
import { translations } from '../utils/lang';
import { getPriorities, cyclePriority, prioritySortValue } from '../utils/priorities';
import { getNotes } from '../utils/notes';
import { detectConflicts, getConflictsForSet, getConflictPartner } from '../utils/conflicts';
import ConflictBanner from './ConflictBanner';
import ShareMenu from './ShareMenu';

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
  isSimulated,
  onShowToast,
  notesVersion
}) {
  const isHe = lang === 'he';
  const t = translations[lang];

  const [priorities, setPriorities] = useState(() => getPriorities());
  const [filterMust, setFilterMust] = useState(false);
  const [notes, setNotesState] = useState(() => getNotes());

  useEffect(() => {
    setNotesState(getNotes());
  }, [notesVersion]);

  const handleCyclePriority = (e, setKey) => {
    e.stopPropagation();
    cyclePriority(setKey);
    setPriorities(getPriorities());
  };

  const buildShareUrl = () => {
    const indices = favorites.map(id => {
      return timetableData.findIndex(set => set.id === id);
    }).filter(idx => idx !== -1);
    if (indices.length === 0) return '';
    return `${window.location.origin}${window.location.pathname}?share=${indices.join(',')}`;
  };

  const handleCopyLink = () => {
    const url = buildShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      onShowToast(t.linkCopied);
    }).catch(err => {
      console.error('Failed to copy share link: ', err);
    });
  };

  const favSets = timetableData.filter(set => favorites.includes(set.id));

  const conflicts = detectConflicts(favSets);
  const conflictSetIds = new Set(
    conflicts.flatMap(c => [c.setA.id, c.setB.id])
  );

  const evalTime = isSimulated ? new Date(simTime) : new Date();
  if (!isSimulated) {
    evalTime.setFullYear(2026);
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

  upcomingFavorites.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.start.localeCompare(b.start);
  });

  const sortedFavs = [...favSets].sort((a, b) => {
    const dayDiff = a.date.localeCompare(b.date);
    if (dayDiff !== 0) return dayDiff;
    const pa = prioritySortValue(getSetUniqueKey(a), priorities);
    const pb = prioritySortValue(getSetUniqueKey(b), priorities);
    if (pa !== pb) return pa - pb;
    return a.start.localeCompare(b.start);
  });

  const groupedByDay = sortedFavs.reduce((acc, set) => {
    if (!acc[set.day]) {
      acc[set.day] = [];
    }
    acc[set.day].push(set);
    return acc;
  }, {});

  const displayGroupedByDay = filterMust
    ? Object.fromEntries(
        Object.entries(groupedByDay)
          .map(([day, sets]) => [day, sets.filter(s => priorities[getSetUniqueKey(s)] === 'must')])
          .filter(([, sets]) => sets.length > 0)
      )
    : groupedByDay;

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

  const renderPriorityIcon = (setKey) => {
    const p = priorities[setKey];
    if (p === 'must') return <Flame size={14} />;
    if (p === 'maybe') return <StarOff size={14} />;
    return <Star size={14} />;
  };

  const getPriorityCardClass = (setKey) => {
    const p = priorities[setKey];
    if (p === 'must') return 'priority-must-card';
    if (p === 'maybe') return 'priority-maybe-card';
    return '';
  };

  return (
    <div className="my-schedule-container stagger-slide-up" style={{ '--card-index': 0 }}>
      <ConflictBanner
        conflicts={conflicts}
        lang={lang}
        onSetClick={onSetClick}
      />

      {/* Live Status Board */}
      {(activeFavorites.length > 0 || upcomingFavorites.length > 0) && (
        <div className="live-favs-section">
          <h3>
            <Radio size={18} className="live-radio-icon" style={{ color: 'var(--primary)' }} />
            <span>{isHe ? 'מה קורה עכשיו בבמות' : 'Live Status Board'}</span>
          </h3>

          <div className="live-favs-grid">
            {activeFavorites.map((set, index) => (
              <div
                key={set.id}
                className={`feed-set-card ${STAGE_CLASSES[set.stage]} active stagger-slide-up`}
                style={{ '--card-index': index + 1 }}
                onClick={() => onSetClick(set)}
              >
                <div className="feed-set-info">
                  <div className="live-now-tag">
                    <span className="live-wave-indicator">
                      <span className="wave-bar bar-1"></span>
                      <span className="wave-bar bar-2"></span>
                      <span className="wave-bar bar-3"></span>
                    </span>
                    <span>{isHe ? 'מנגן כרגע' : 'Now Playing'}</span>
                  </div>
                  <div className="feed-artist-name">{set.artist}</div>
                  <div className="feed-stage-name">
                    <span className="stage-dot"></span>
                    <span>{set.stage}</span>
                  </div>
                  <div className="feed-time-duration">{set.start} - {set.end}</div>
                </div>
              </div>
            ))}

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
                  <div className="feed-stage-name">
                    <span className="stage-dot"></span>
                    <span>{set.stage}</span>
                  </div>
                  <div className="feed-time-duration">{set.day} • {set.start}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Timeline List */}
      <div className="fav-feed-section">
        <div className="fav-feed-header-row">
          <h3>{isHe ? 'ציר הזמן שלי' : 'My Personal Timeline'}</h3>
          <button
            className={`filter-must-btn ${filterMust ? 'active' : ''}`}
            onClick={() => setFilterMust(!filterMust)}
          >
            <Filter size={14} />
            <span>{t.filterMustSee}</span>
          </button>
          <ShareMenu
            shareUrl={buildShareUrl()}
            lang={lang}
            onCopyLink={handleCopyLink}
            onExportImage={() => {}}
          />
        </div>
        <div className="feed-view">
          {Object.entries(displayGroupedByDay).map(([day, daySets]) => (
            <div key={day} className="feed-time-block">
              <div className="feed-time-header">
                {isHe ? day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון') : day}
              </div>
              <div className="feed-sets-list">
                {daySets.map((set, index) => {
                  const status = getSetStatus(set, evalTime);
                  const setKey = getSetUniqueKey(set);
                  return (
                    <div
                      key={set.id}
                      className={`feed-set-card ${STAGE_CLASSES[set.stage]} ${status} ${getPriorityCardClass(setKey)} stagger-slide-up`}
                      style={{ '--card-index': index }}
                      onClick={() => onSetClick(set)}
                    >
                      <div className="feed-set-info">
                        <div className="feed-artist-name">{set.artist}</div>
                        <div className="feed-stage-name">
                          <span className="stage-dot"></span>
                          <span>{set.stage} {set.type ? `• ${set.type}` : ''}</span>
                        </div>
                        <div className="feed-time-duration">{set.start} - {set.end}</div>
                        {notes[setKey] && (
                          <div className="feed-note-text">
                            <MessageSquare size={11} />
                            <span>{notes[setKey]}</span>
                          </div>
                        )}
                        {conflictSetIds.has(set.id) && (
                          <div className="feed-conflict-badge">
                            <AlertTriangle size={11} />
                            <span>
                              {t.conflictsWith}{' '}
                              {getConflictsForSet(set.id, conflicts)
                                .map(c => getConflictPartner(set.id, c).artist)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="feed-card-actions">
                        <button
                          className={`priority-btn priority-${priorities[setKey] || 'none'}`}
                          onClick={(e) => handleCyclePriority(e, setKey)}
                          aria-label="Set priority"
                        >
                          {renderPriorityIcon(setKey)}
                        </button>
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

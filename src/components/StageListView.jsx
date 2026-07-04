import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Star, Music } from 'lucide-react';
import StageTotem from './StageTotem';
import ArtistNameWithFlags from './ArtistNameWithFlags';
import { trackEvent } from '../utils/analytics';

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

const STAGE_SHORT_NAMES = {
  "OZORA STAGE": { en: "Ozora Stage", he: "במת אוזורה" },
  "PUMPUI": { en: "Pumpui", he: "פומפוי" },
  "THE DOME": { en: "The Dome", he: "הדום" },
  "DRAGON NEST / COOKING GROOVE": { en: "Dragon Nest", he: "דרגון נסט" },
  "VISIUM GARDEN": { en: "Visium", he: "ויזיום" },
  "TEK ZERO (2000s Trance)": { en: "Tek Zero", he: "טק זירו" }
};

function MusicDropdown({ artist }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="feed-music-wrapper" ref={ref}>
      <button
        className="feed-music-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-label="Listen to music"
      >
        <Music size={14} />
      </button>
      {open && (
        <div className="feed-music-dropdown">
          <button onClick={(e) => {
            e.stopPropagation();
            trackEvent('listen_music', { platform: 'youtube', artist_name: artist });
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(artist)}+music`, '_blank', 'noopener,noreferrer');
            setOpen(false);
          }}>YouTube</button>
          <button onClick={(e) => {
            e.stopPropagation();
            trackEvent('listen_music', { platform: 'soundcloud', artist_name: artist });
            window.open(`https://soundcloud.com/search?q=${encodeURIComponent(artist)}`, '_blank', 'noopener,noreferrer');
            setOpen(false);
          }}>SoundCloud</button>
        </div>
      )}
    </div>
  );
}

// Helper to convert time string into festival-day minutes (06:00 to 30:00)
function getFestivalMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  // Add 24 hours to early morning hours (00:00 to 05:59)
  const adjustedH = h < 6 ? h + 24 : h;
  return adjustedH * 60 + m;
}

export default function StageListView({ lang, sets, favorites, toggleFavorite, onSetClick, activeStatusMap, selectedStage }) {
  const isHe = lang === 'he';

  // Group sets by stage
  const setsByStage = useMemo(() => {
    return sets.reduce((acc, set) => {
      if (!acc[set.stage]) acc[set.stage] = [];
      acc[set.stage].push(set);
      return acc;
    }, {});
  }, [sets]);

  // Order active stages according to defined STAGES array
  const activeStages = useMemo(() => {
    return STAGES.filter(stage => setsByStage[stage]?.length > 0);
  }, [setsByStage]);

  // Collapsible state for each stage accordion - default is closed (false)
  const [expandedStages, setExpandedStages] = useState(() => {
    const initial = {};
    STAGES.forEach(stage => {
      initial[stage] = selectedStage !== 'ALL' && selectedStage === stage;
    });
    return initial;
  });

  // Auto-expand stage accordion when filter is changed
  useEffect(() => {
    if (selectedStage !== 'ALL') {
      setExpandedStages(prev => ({
        ...prev,
        [selectedStage]: true
      }));
    }
  }, [selectedStage]);

  const toggleStageExpand = (stageName) => {
    setExpandedStages(prev => {
      const nextVal = !prev[stageName];
      trackEvent('stage_lineup_expand', { stage_name: stageName, expanded: nextVal });
      return {
        ...prev,
        [stageName]: nextVal
      };
    });
  };

  // Helper to calculate stage operating hours for the day
  const getStageHoursString = (stageSets) => {
    if (!stageSets || stageSets.length === 0) return '';
    const sorted = [...stageSets].sort((a, b) => getFestivalMinutes(a.start) - getFestivalMinutes(b.start));
    const firstStart = sorted[0].start;
    const lastEnd = sorted[sorted.length - 1].end;
    const endsNextDay = sorted[sorted.length - 1].endsNextDay || sorted[sorted.length - 1].end < sorted[sorted.length - 1].start;
    return `${firstStart} - ${lastEnd}${endsNextDay ? ' (+1d)' : ''}`;
  };

  return (
    <div className="stage-list-view">
      {activeStages.map((stage) => {
        const stageSets = setsByStage[stage] || [];
        // Sort chronologically by festival-adjusted start time
        const sortedSets = [...stageSets].sort((a, b) => getFestivalMinutes(a.start) - getFestivalMinutes(b.start));
        const isOpen = expandedStages[stage];
        const shortName = STAGE_SHORT_NAMES[stage]?.[lang] || STAGE_SHORT_NAMES[stage]?.['en'] || stage;
        const stageClass = STAGE_CLASSES[stage];
        const hoursStr = getStageHoursString(sortedSets);

        return (
          <div key={stage} className={`stage-accordion ${stageClass} ${isOpen ? 'open' : ''}`}>
            <button
              className="stage-accordion-header"
              onClick={() => toggleStageExpand(stage)}
              aria-expanded={isOpen}
            >
              <div className="stage-accordion-header-left">
                <span className="stage-accordion-totem">
                  <StageTotem stage={stage} size={20} />
                </span>
                <span className="stage-accordion-title">{shortName}</span>
              </div>
              
              <div className="stage-accordion-meta">
                <span className="stage-accordion-hours" title={isHe ? "שעות פעילות" : "Operating Hours"}>
                  {hoursStr}
                </span>
                <span className="stage-accordion-count">
                  {sortedSets.length} {isHe ? 'אמנים' : 'artists'}
                </span>
                <ChevronDown className="stage-accordion-chevron" size={18} />
              </div>
            </button>

            {isOpen && (
              <div className="stage-accordion-content">
                {sortedSets.map((set, index) => {
                  const isFav = favorites.includes(set.id);
                  const status = activeStatusMap[set.id] || '';
                  const isPlaying = status === 'active';

                  return (
                    <div
                      key={set.id}
                      id={`feed-set-${set.id}`}
                      className={`feed-set-card ${stageClass} ${status} stagger-slide-up`}
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
                          <ArtistNameWithFlags artist={set.artist} />
                        </div>
                        <div className="feed-time-duration">
                          {set.start} - {set.end} {set.endsNextDay ? '(+1d)' : ''} {set.type ? `• ${set.type}` : ''}
                        </div>
                      </div>

                      <div className="feed-set-actions" onClick={(e) => e.stopPropagation()}>
                        <MusicDropdown artist={set.artist} />
                        <button
                          className="feed-fav-btn"
                          onClick={() => toggleFavorite(set.id)}
                          aria-label={isFav ? "Remove from schedule" : "Add to schedule"}
                        >
                          <Star
                            size={16}
                            fill={isFav ? 'var(--stage-visium)' : 'none'}
                            stroke={isFav ? 'var(--stage-visium)' : 'currentColor'}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import StageTotem from './StageTotem';
import ArtistNameWithFlags from './ArtistNameWithFlags';

const STAGES = [
  "OZORA STAGE",
  "PUMPUI",
  "THE DOME",
  "DRAGON NEST / COOKING GROOVE",
  "VISIUM GARDEN",
  "TEK ZERO (2000s Trance)"
];

const STAGE_SHORT_NAMES = {
  "OZORA STAGE": { en: "Ozora", he: "אוזורה" },
  "PUMPUI": { en: "Pumpui", he: "פומפוי" },
  "THE DOME": { en: "The Dome", he: "הדום" },
  "DRAGON NEST / COOKING GROOVE": { en: "Dragon Nest", he: "דרגון נסט" },
  "VISIUM GARDEN": { en: "Visium", he: "ויזיום" },
  "TEK ZERO (2000s Trance)": { en: "Tek Zero", he: "טק זירו" }
};

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function StageLineupSelector({ sets, selectedStage, onChange, lang, favorites, toggleFavorite, activeStatusMap, onSetClick }) {
  const isHe = lang === 'he';
  const [expandedStages, setExpandedStages] = useState(() => new Set());

  const activeStages = STAGES.filter(stage => sets.some(s => s.stage === stage));

  const toggleExpanded = (stage) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  return (
    <div className="stage-lineup-container">
      <div className="stage-lineup-row">
        <button
          className={`stage-lineup-all ${selectedStage === 'ALL' ? 'active' : ''}`}
          onClick={() => onChange('ALL')}
          title={isHe ? "כל הבמות" : "All Stages"}
        >
          <StageTotem stage="ALL" size={18} />
          <span>{isHe ? "הכל" : "All"}</span>
        </button>

        {activeStages.map((stage) => {
          const isActive = selectedStage === stage;
          const isExpanded = expandedStages.has(stage);
          const shortName = STAGE_SHORT_NAMES[stage]?.[lang] || STAGE_SHORT_NAMES[stage]?.['en'] || stage;
          const stageClass = STAGE_CLASSES[stage];
          const stageSets = sets
            .filter(s => s.stage === stage)
            .sort((a, b) => a.start.localeCompare(b.start));

          return (
            <div key={stage} className={`stage-lineup-card ${stageClass} ${isActive ? 'active' : ''}`}>
              <button
                className="stage-lineup-card-header"
                onClick={() => onChange(isActive ? 'ALL' : stage)}
                title={stage}
              >
                <StageTotem stage={stage} size={18} />
                <span className="stage-lineup-name">{shortName}</span>
                <span className="stage-lineup-count">{stageSets.length}</span>
              </button>
              <button
                className="stage-lineup-expand-btn"
                onClick={(e) => { e.stopPropagation(); toggleExpanded(stage); }}
                aria-expanded={isExpanded}
                aria-label={isHe ? 'הצג רשימת אמנים' : 'Show artist list'}
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExpanded && (
                <div className="stage-lineup-artist-list">
                  {stageSets.map(set => {
                    const isFav = favorites.includes(set.id);
                    const status = activeStatusMap[set.id] || '';
                    return (
                      <div
                        key={set.id}
                        className={`stage-lineup-artist-row ${status}`}
                        onClick={() => onSetClick(set)}
                      >
                        <span className="stage-lineup-artist-time">{set.start}</span>
                        <span className="stage-lineup-artist-name">
                          <ArtistNameWithFlags artist={set.artist} />
                        </span>
                        <button
                          className="stage-lineup-artist-fav"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(set.id); }}
                        >
                          <Star size={14} fill={isFav ? 'var(--stage-visium)' : 'none'} stroke={isFav ? 'var(--stage-visium)' : 'currentColor'} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

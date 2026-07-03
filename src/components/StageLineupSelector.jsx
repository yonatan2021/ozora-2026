import { Check } from 'lucide-react';
import StageTotem from './StageTotem';

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

export default function StageLineupSelector({ sets, selectedStage, onChange, lang }) {
  const isHe = lang === 'he';

  const activeStages = STAGES.filter(stage => sets.some(s => s.stage === stage));

  return (
    <div className="stage-lineup-container">
      <div className="stage-lineup-label">
        {isHe ? 'סינון לפי במה' : 'Filter by stage'}
      </div>
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
                title={isHe ? `סנן לפי ${shortName}` : `Filter by ${shortName}`}
                aria-pressed={isActive}
              >
                <StageTotem stage={stage} size={18} />
                <span className="stage-lineup-name">{shortName}</span>
                <span className="stage-lineup-count">{stageSets.length}</span>
                {isActive && <Check className="stage-lineup-active-icon" size={16} aria-hidden="true" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

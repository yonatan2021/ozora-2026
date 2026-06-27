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

export default function MandalaStageSelector({ selectedStage, onChange, lang }) {
  const isHe = lang === 'he';

  return (
    <div className="mandala-container">
      <div className="mandala-row">
        <button
          className={`mandala-btn stage-all ${selectedStage === 'ALL' ? 'active' : ''}`}
          onClick={() => onChange('ALL')}
          title={isHe ? "כל הבמות" : "All Stages"}
        >
          <StageTotem stage="ALL" size={18} />
          <span>{isHe ? "הכל" : "All"}</span>
        </button>
        {STAGES.map((stage) => {
          const isActive = selectedStage === stage;
          const shortName = STAGE_SHORT_NAMES[stage]?.[lang] || STAGE_SHORT_NAMES[stage]?.['en'] || stage;
          const stageClass = STAGE_CLASSES[stage];
          return (
            <button
              key={stage}
              className={`mandala-btn ${stageClass} ${isActive ? 'active' : ''}`}
              onClick={() => onChange(stage)}
              title={stage}
            >
              <StageTotem stage={stage} size={18} />
              <span>{shortName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

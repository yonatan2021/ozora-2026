import { useState, useEffect, useRef } from 'react';
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
  const [isRotating, setIsRotating] = useState(false);
  const isHe = lang === 'he';
  const timeoutRef = useRef(null);

  const handleStageSelect = (stage) => {
    setIsRotating(true);
    onChange(stage);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsRotating(false), 800);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="mandala-container">
      {/* Mobile view: horizontal scroll of glowing badges with totems */}
      <div className="mandala-mobile-row">
        <button
          className={`mandala-mobile-btn stage-all ${selectedStage === 'ALL' ? 'active' : ''}`}
          onClick={() => handleStageSelect('ALL')}
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
              className={`mandala-mobile-btn ${stageClass} ${isActive ? 'active' : ''}`}
              onClick={() => handleStageSelect(stage)}
              title={stage}
            >
              <StageTotem stage={stage} size={18} />
              <span>{shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop view: sacred geometric mandala circle layout */}
      <div className="mandala-desktop-wheel">
        <div className={`mandala-ring-structure ${isRotating ? 'rotating-pulse' : ''}`}>
          {/* SVG Geometric Lines */}
          <svg className="mandala-vector-bg" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="100" stroke="var(--border)" fill="none" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="150" cy="150" r="60" stroke="var(--border-strong)" fill="none" strokeWidth="0.5" />
            {STAGES.map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              const x2 = 150 + 100 * Math.cos(angle);
              const y2 = 150 + 100 * Math.sin(angle);
              return <line key={i} x1="150" y1="150" x2={x2} y2={y2} stroke="var(--border)" strokeWidth="0.6" />;
            })}
          </svg>

          {/* Center node: ALL */}
          <button
            className={`mandala-node center-node stage-all ${selectedStage === 'ALL' ? 'active' : ''}`}
            onClick={() => handleStageSelect('ALL')}
            title={isHe ? "כל הבמות" : "All Stages"}
            style={{ left: '150px', top: '150px' }}
          >
            <StageTotem stage="ALL" size={24} />
          </button>

          {/* Satellite nodes: Stages */}
          {STAGES.map((stage, i) => {
            const isActive = selectedStage === stage;
            const angle = (i * 60 - 90) * Math.PI / 180; // Start at top
            const r = 100;
            const x = 150 + r * Math.cos(angle);
            const y = 150 + r * Math.sin(angle);
            const shortName = STAGE_SHORT_NAMES[stage]?.[lang] || STAGE_SHORT_NAMES[stage]?.['en'] || stage;
            const stageClass = STAGE_CLASSES[stage];
            
            return (
              <button
                key={stage}
                className={`mandala-node satellite-node ${stageClass} ${isActive ? 'active' : ''}`}
                onClick={() => handleStageSelect(stage)}
                title={stage}
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                <StageTotem stage={stage} size={22} />
                <span className="node-tooltip">{shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

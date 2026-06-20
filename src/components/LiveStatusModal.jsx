import { X, Play, ArrowRight } from 'lucide-react';
import { parseSetDateTime, getSetStatus } from '../utils/time';
import { translations } from '../utils/lang';

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

function getStageStatus(stage, timetableData, simDateTime) {
  const stageSets = timetableData.filter(s => s.stage === stage);
  
  let activeSet = null;
  let nextSet = null;
  let minDiff = Infinity;
  
  const simTimeMs = simDateTime.getTime();
  
  stageSets.forEach(set => {
    const status = getSetStatus(set, simDateTime);
    if (status === 'active') {
      activeSet = set;
    } else if (status === 'future') {
      const startObj = parseSetDateTime(set.date, set.start);
      const diff = startObj.getTime() - simTimeMs;
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextSet = set;
      }
    }
  });
  
  return { activeSet, nextSet };
}

function calculateProgress(set, simDateTime) {
  if (!set) return 0;
  const startObj = parseSetDateTime(set.date, set.start);
  let endObj = parseSetDateTime(set.date, set.end);
  if (set.endsNextDay || set.end < set.start) {
    endObj.setDate(endObj.getDate() + 1);
  }
  const total = endObj.getTime() - startObj.getTime();
  const elapsed = simDateTime.getTime() - startObj.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export default function LiveStatusModal({ isOpen, onClose, lang, simTime, timetableData, onSelectSet }) {
  if (!isOpen) return null;

  const t = translations[lang];
  const evalDate = new Date(simTime);

  const formatSimTime = (ts) => {
    return new Date(ts).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleCardClick = (set) => {
    if (set) {
      onSelectSet(set);
      onClose();
    }
  };

  return (
    <div className="live-modal-overlay" onClick={onClose}>
      <div className="live-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="live-modal-header">
          <div className="live-modal-title-area">
            <h2>{lang === 'he' ? 'מצב הבמות כעת' : "Live Stage Status"}</h2>
            <div className="live-modal-subtitle">
              <span className="live-dot-pulse"></span>
              {formatSimTime(simTime)}
            </div>
          </div>
          <button className="live-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </header>

        <div className="live-stage-grid">
          {STAGES.map(stage => {
            const { activeSet, nextSet } = getStageStatus(stage, timetableData, evalDate);
            const progress = calculateProgress(activeSet, evalDate);
            const stageClass = STAGE_CLASSES[stage];

            return (
              <div 
                key={stage} 
                className={`live-stage-card ${stageClass} ${activeSet ? 'has-active' : 'inactive'}`}
                onClick={() => handleCardClick(activeSet || nextSet)}
                title={activeSet ? (lang === 'he' ? 'לחץ למעבר להופעה בלוח' : 'Click to view in timetable') : ''}
              >
                <div className="live-card-badge">
                  {stage}
                </div>

                <div className="live-card-body">
                  {activeSet ? (
                    <div className="live-active-info">
                      <div className="live-now-tag">
                        <Play size={12} fill="currentColor" />
                        <span>{t.nowPlaying}</span>
                      </div>
                      <div className="live-artist-name">{activeSet.artist}</div>
                      <div className="live-time-range">
                        {activeSet.start} - {activeSet.end}
                      </div>
                      <div className="live-progress-container">
                        <div className="live-progress-track">
                          <div 
                            className="live-progress-fill" 
                            style={{ 
                              width: `${progress}%`
                            }}
                          />
                        </div>
                        <span className="live-progress-text">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="live-empty-state">
                      {lang === 'he' ? 'אין הופעה פעילה כעת' : 'No performance playing'}
                    </div>
                  )}

                  {nextSet ? (
                    <div className="live-next-info">
                      <div className="live-next-tag">
                        <ArrowRight size={12} />
                        <span>{t.nextUp}</span>
                      </div>
                      <div className="live-next-artist">
                        {nextSet.artist} <span className="live-next-time">({nextSet.start})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="live-next-empty">
                      {lang === 'he' ? 'אין הופעות נוספות' : 'No upcoming performances'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

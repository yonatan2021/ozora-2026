import { AlertTriangle } from 'lucide-react';
import { translations } from '../utils/lang';

export default function ConflictBanner({ conflicts, lang, onSetClick }) {
  if (conflicts.length === 0) return null;

  const t = translations[lang];

  return (
    <div className="conflict-banner">
      <h4 className="conflict-banner-title">
        <AlertTriangle size={16} />
        <span>{t.conflicts} ({conflicts.length})</span>
      </h4>
      <div className="conflict-list">
        {conflicts.map((conflict, i) => (
          <div key={i} className="conflict-item">
            <span
              className="conflict-artist-link"
              onClick={() => onSetClick(conflict.setA)}
            >
              {conflict.setA.artist}
            </span>
            <span className="conflict-overlap-badge">
              {conflict.overlapMinutes}{t.conflictMinutes}
            </span>
            <span
              className="conflict-artist-link"
              onClick={() => onSetClick(conflict.setB)}
            >
              {conflict.setB.artist}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

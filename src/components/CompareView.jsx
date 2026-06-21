import { X, Plus } from 'lucide-react';
import { translations } from '../utils/lang';
import { getSetUniqueKey } from '../utils/time';

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function CompareView({ friendName, friendSetKeys, myFavorites, timetableData, lang, onSetClick, onClose, onAddToFavorites }) {
  const t = translations[lang];
  const myKeys = new Set(timetableData.filter(s => myFavorites.includes(s.id)).map(getSetUniqueKey));
  const friendKeys = new Set(friendSetKeys);

  const allKeys = new Set([...myKeys, ...friendKeys]);
  const allSets = [...allKeys].map(key =>
    timetableData.find(s => getSetUniqueKey(s) === key)
  ).filter(Boolean);

  allSets.sort((a, b) => {
    const dd = a.date.localeCompare(b.date);
    if (dd !== 0) return dd;
    return a.start.localeCompare(b.start);
  });

  const grouped = allSets.reduce((acc, set) => {
    if (!acc[set.day]) acc[set.day] = [];
    acc[set.day].push(set);
    return acc;
  }, {});

  const getTag = (set) => {
    const key = getSetUniqueKey(set);
    const mine = myKeys.has(key);
    const theirs = friendKeys.has(key);
    if (mine && theirs) return 'both';
    if (mine) return 'mine';
    return 'friend';
  };

  return (
    <div className="compare-view">
      <div className="compare-header">
        <h3>{t.comparingWith} {friendName}</h3>
        <button className="compare-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="compare-legend">
        <span className="compare-tag both">{t.bothPicked}</span>
        <span className="compare-tag mine">{t.onlyYou}</span>
        <span className="compare-tag friend">{t.onlyFriend} {friendName}</span>
      </div>

      <div className="compare-timeline">
        {Object.entries(grouped).map(([day, sets]) => (
          <div key={day} className="compare-day-group">
            <div className="feed-time-header">
              {lang === 'he'
                ? day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון')
                : day}
            </div>
            {sets.map(set => {
              const tag = getTag(set);
              return (
                <div
                  key={set.id}
                  className={`compare-set-card ${STAGE_CLASSES[set.stage]} compare-${tag}`}
                  onClick={() => onSetClick(set)}
                >
                  <div className="compare-set-info">
                    <span className="compare-tag-badge">{
                      tag === 'both' ? t.bothPicked :
                      tag === 'mine' ? t.onlyYou :
                      `${t.onlyFriend} ${friendName}`
                    }</span>
                    <div className="feed-artist-name">{set.artist}</div>
                    <div className="feed-stage-name">
                      <span className="stage-dot"></span>
                      <span>{set.stage}</span>
                    </div>
                    <div className="feed-time-duration">{set.start} - {set.end}</div>
                  </div>
                  {tag === 'friend' && (
                    <button
                      className="compare-add-btn"
                      onClick={(e) => { e.stopPropagation(); onAddToFavorites(set.id); }}
                    >
                      <Plus size={14} />
                      <span>{t.addToMine}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

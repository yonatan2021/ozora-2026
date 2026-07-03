import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { translations } from '../utils/lang';
import { getSetUniqueKey, getSetStatus } from '../utils/time';
import ArtistNameWithFlags from './ArtistNameWithFlags';

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function FriendScheduleView({
  friendName,
  friendSetKeys,
  myFavorites,
  timetableData,
  lang,
  onSetClick,
  onClose,
  onAddToFavorites
}) {
  const t = translations[lang];
  const isHe = lang === 'he';

  const friendSets = friendSetKeys
    .map(key => timetableData.find(s => getSetUniqueKey(s) === key))
    .filter(Boolean);

  friendSets.sort((a, b) => {
    const dd = a.date.localeCompare(b.date);
    if (dd !== 0) return dd;
    return a.start.localeCompare(b.start);
  });

  const grouped = friendSets.reduce((acc, set) => {
    if (!acc[set.day]) acc[set.day] = [];
    acc[set.day].push(set);
    return acc;
  }, {});

  const BackIcon = isHe ? ArrowRight : ArrowLeft;

  return (
    <div className="friend-schedule-view stagger-slide-up">
      <div className="friend-view-header">
        <button className="friend-view-back-btn" onClick={onClose} aria-label={t.backToMySchedule}>
          <BackIcon size={18} />
          <span>{t.backToMySchedule}</span>
        </button>
        <h3>{t.viewingSchedule.replace('{name}', friendName)}</h3>
      </div>

      <div className="friend-view-timeline">
        {friendSets.length === 0 ? (
          <div className="empty-state">
            <p>{isHe ? 'אין הופעות בלוח של חבר זה.' : 'No sets in this friend\'s schedule.'}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, sets]) => (
            <div key={day} className="friend-day-group">
              <div className="feed-time-header">
                {isHe
                  ? day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון')
                  : day}
              </div>
              <div className="feed-sets-list">
                {sets.map(set => {
                  const isFav = myFavorites.includes(set.id);
                  const evalTime = new Date();
                  evalTime.setFullYear(2026); // Match app-wide evaluation context
                  const status = getSetStatus(set, evalTime);

                  return (
                    <div
                      key={set.id}
                      className={`feed-set-card ${STAGE_CLASSES[set.stage]} ${status}`}
                      onClick={() => onSetClick(set)}
                    >
                      <div className="feed-set-info">
                        <div className="feed-artist-name">
                          <ArtistNameWithFlags artist={set.artist} />
                        </div>
                        <div className="feed-stage-name">
                          <span className="stage-dot"></span>
                          <span>{set.stage} {set.type ? `• ${set.type}` : ''}</span>
                        </div>
                        <div className="feed-time-duration">{set.start} - {set.end}</div>
                      </div>
                      <div className="feed-card-actions">
                        <button
                          className="feed-fav-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToFavorites(set.id);
                          }}
                          title={isFav ? t.removeFromMySchedule : t.addToMySchedule}
                          aria-label={isFav ? t.removeFromMySchedule : t.addToMySchedule}
                        >
                          <Star
                            size={16}
                            fill={isFav ? "var(--stage-visium)" : "none"}
                            stroke="var(--stage-visium)"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

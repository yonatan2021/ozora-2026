import { useState } from 'react';
import { X, Plus, Share2, MessageSquare } from 'lucide-react';
import { translations } from '../utils/lang';
import { getSetUniqueKey } from '../utils/time';
import { getPriorities } from '../utils/priorities';
import { getNotes } from '../utils/notes';
import ArtistNameWithFlags from './ArtistNameWithFlags';
import { getMyScheduleId, saveCoordinationNote } from '../utils/friends';
import { compressPayload } from '../utils/shareSerialization';

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function CompareView({
  friendId,
  friendName,
  friendSetKeys,
  friendPriorities,
  coordinationNotes,
  myFavorites,
  timetableData,
  lang,
  onSetClick,
  onClose,
  onAddToFavorites,
  onCoordinationUpdate,
  onShowToast
}) {
  const t = translations[lang];
  const [localCoordNotes, setLocalCoordNotes] = useState(coordinationNotes || {});
  const [editingSetKey, setEditingSetKey] = useState(null);
  const [editingText, setEditingText] = useState('');

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

  const handleEditNote = (setKey, currentNote) => {
    setEditingSetKey(setKey);
    setEditingText(currentNote || '');
  };

  const handleSaveNote = (setKey) => {
    const trimmed = editingText.trim();
    saveCoordinationNote(friendId, setKey, trimmed);
    const updated = { ...localCoordNotes };
    if (trimmed) {
      updated[setKey] = trimmed;
    } else {
      delete updated[setKey];
    }
    setLocalCoordNotes(updated);
    setEditingSetKey(null);
    setEditingText('');
    if (onCoordinationUpdate) onCoordinationUpdate();
  };

  const handleShareBack = () => {
    const myId = getMyScheduleId();
    const myName = localStorage.getItem('ozora_schedule_name') || '';
    const myPriorities = getPriorities();
    const myNotes = getNotes();

    const encodedSets = myFavorites.map(id => {
      const set = timetableData.find(s => s.id === id);
      if (!set) return null;
      const setKey = getSetUniqueKey(set);
      const setIdx = timetableData.indexOf(set);

      const priority = myPriorities[setKey];
      let pVal = 0;
      if (priority === 'must') pVal = 1;
      else if (priority === 'want') pVal = 2;
      else if (priority === 'maybe') pVal = 3;

      const note = myNotes[setKey];
      if (note) return [setIdx, pVal, note];
      if (pVal) return [setIdx, pVal];
      return [setIdx];
    }).filter(Boolean);

    // Map coordination note keys (composite keys) to timetable indices
    const encodedCoord = {};
    Object.entries(localCoordNotes).forEach(([key, noteText]) => {
      const set = timetableData.find(s => getSetUniqueKey(s) === key);
      if (set) {
        encodedCoord[timetableData.indexOf(set)] = noteText;
      }
    });

    const payload = {
      id: myId,
      name: myName,
      sets: encodedSets,
      ...(Object.keys(encodedCoord).length > 0 && { coord: encodedCoord })
    };

    const compressed = compressPayload(payload);
    const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;

    navigator.clipboard.writeText(url).then(() => {
      if (onShowToast) onShowToast(t.linkCopied);
    }).catch(err => {
      console.error('Failed to copy share-back link:', err);
    });
  };

  return (
    <div className="compare-view">
      <div className="compare-header">
        <h3>{t.comparingWith} {friendName}</h3>
        <div className="compare-header-actions">
          <button className="compare-share-back-btn" onClick={handleShareBack} title={t.shareBackWith?.replace('{name}', friendName)}>
            <Share2 size={16} />
            <span>{t.shareBackWith?.replace('{name}', friendName)}</span>
          </button>
          <button className="compare-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
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
              const setKey = getSetUniqueKey(set);
              const coordNote = localCoordNotes[setKey];
              const isEditing = editingSetKey === setKey;
              return (
                <div
                  key={set.id}
                  className={`compare-set-card ${STAGE_CLASSES[set.stage]} compare-${tag}`}
                  onClick={() => !isEditing && onSetClick(set)}
                >
                  <div className="compare-set-info">
                    <span className="compare-tag-badge">{
                      tag === 'both' ? t.bothPicked :
                      tag === 'mine' ? t.onlyYou :
                      `${t.onlyFriend} ${friendName}`
                    }</span>
                    <div className="feed-artist-name">
                      <ArtistNameWithFlags artist={set.artist} />
                    </div>
                    <div className="feed-stage-name">
                      <span className="stage-dot"></span>
                      <span>{set.stage}</span>
                    </div>
                    <div className="feed-time-duration">{set.start} - {set.end}</div>

                    {/* Coordination note */}
                    {isEditing ? (
                      <div className="coord-note-edit" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          className="coord-note-input"
                          placeholder={t.coordinationNotePlaceholder}
                          value={editingText}
                          maxLength={100}
                          onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveNote(setKey);
                            if (e.key === 'Escape') { setEditingSetKey(null); setEditingText(''); }
                          }}
                          autoFocus
                        />
                        <button className="coord-note-save-btn" onClick={() => handleSaveNote(setKey)}>✓</button>
                      </div>
                    ) : (
                      <div className="coord-note-row" onClick={e => { e.stopPropagation(); handleEditNote(setKey, coordNote); }}>
                        <MessageSquare size={11} className="coord-note-icon" />
                        <span className="coord-note-text">
                          {coordNote || t.coordinationNote}
                        </span>
                      </div>
                    )}
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

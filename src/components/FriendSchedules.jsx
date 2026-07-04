import { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Trash2, GitCompare } from 'lucide-react';
import { translations } from '../utils/lang';
import { getFriends, removeFriend } from '../utils/friends';
import CompareView from './CompareView';
import { trackEvent } from '../utils/analytics';

export default function FriendSchedules({ lang, timetableData, myFavorites, onSetClick, toggleFavorite, onShowToast }) {
  const [friends, setFriends] = useState(() => getFriends());
  const [expanded, setExpanded] = useState(false);
  const [comparingFriendId, setComparingFriendId] = useState(null);
  const t = translations[lang];

  const friendEntries = Object.entries(friends);
  if (friendEntries.length === 0) return null;

  const handleRemove = (friendId) => {
    removeFriend(friendId);
    setFriends(getFriends());
    trackEvent('remove_friend');
    onShowToast(t.friendRemoved);
  };

  const handleCompare = (friendId) => {
    setComparingFriendId(friendId);
    trackEvent('compare_friend');
  };

  const handleCoordinationUpdate = () => {
    setFriends(getFriends());
  };

  if (comparingFriendId) {
    const friendData = friends[comparingFriendId];
    return (
      <CompareView
        friendId={comparingFriendId}
        friendName={friendData.name}
        friendSetKeys={friendData.sets}
        friendPriorities={friendData.priorities || {}}
        coordinationNotes={friendData.coordinationNotes || {}}
        myFavorites={myFavorites}
        timetableData={timetableData}
        lang={lang}
        onSetClick={onSetClick}
        onClose={() => setComparingFriendId(null)}
        onAddToFavorites={(id) => toggleFavorite(id, 'compare')}
        onCoordinationUpdate={handleCoordinationUpdate}
        onShowToast={onShowToast}
      />
    );
  }

  return (
    <div className="friend-schedules-section">
      <button className="friend-section-toggle" onClick={() => setExpanded(!expanded)}>
        <Users size={16} />
        <span>{t.friendSchedules} ({friendEntries.length})</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="friend-list">
          {friendEntries.map(([friendId, data]) => (
            <div key={friendId} className="friend-card">
              <div className="friend-info">
                <span className="friend-name">{data.name}</span>
                <span className="friend-count">{data.sets.length} {t.friendSets}</span>
              </div>
              <div className="friend-actions">
                <button onClick={() => handleCompare(friendId)} className="friend-action-btn">
                  <GitCompare size={14} />
                  <span>{t.compare}</span>
                </button>
                <button onClick={() => handleRemove(friendId)} className="friend-action-btn danger">
                  <Trash2 size={14} />
                  <span>{t.remove}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

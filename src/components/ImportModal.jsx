import { useState } from 'react';
import { Users, Download, UserPlus, Eye } from 'lucide-react';
import { translations } from '../utils/lang';

export default function ImportModal({ sharedSets, lang, onImportAll, onSaveAsFriend, onDismiss }) {
  const [friendName, setFriendName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const t = translations[lang];

  const handleSaveAsFriend = () => {
    if (!showNameInput) {
      setShowNameInput(true);
      return;
    }
    if (friendName.trim()) {
      onSaveAsFriend(friendName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <Users size={32} className="import-modal-icon" />
        <h3 className="import-modal-title">{t.importTitle}</h3>
        <p className="import-modal-count">
          {sharedSets.sets.length} {t.importSetsCount}
        </p>

        <div className="import-modal-actions">
          <button className="import-modal-btn primary" onClick={onImportAll}>
            <Download size={16} />
            <span>{t.importAll}</span>
          </button>

          {showNameInput && (
            <input
              type="text"
              className="import-friend-name-input"
              placeholder={t.friendNamePlaceholder}
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveAsFriend()}
            />
          )}

          <button className="import-modal-btn secondary" onClick={handleSaveAsFriend}>
            <UserPlus size={16} />
            <span>{t.saveAsFriend}</span>
          </button>

          <button className="import-modal-btn ghost" onClick={onDismiss}>
            <Eye size={16} />
            <span>{t.justView}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

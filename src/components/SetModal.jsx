import React from 'react';
import { X, Star, MapPin, Clock, Tag } from 'lucide-react';
import { translations } from '../utils/lang';

export default function SetModal({ set, lang, favorites, toggleFavorite, onClose }) {
  if (!set) return null;
  const t = translations[lang];
  const isFav = favorites.includes(set.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2 className="modal-artist">{set.artist}</h2>
        
        <div className="modal-details">
          <div className="detail-item">
            <MapPin size={18} className="detail-icon" />
            <div>
              <strong>{t.stage}:</strong> {set.stage}
            </div>
          </div>
          
          <div className="detail-item">
            <Clock size={18} className="detail-icon" />
            <div>
              <strong>{t.time}:</strong> {set.start} - {set.end} {set.endsNextDay ? '(+1d)' : ''}
            </div>
          </div>

          <div className="detail-item">
            <Tag size={18} className="detail-icon" />
            <div>
              <strong>{t.type}:</strong> {set.type}
            </div>
          </div>
        </div>

        <button 
          className={`modal-fav-btn ${isFav ? 'active' : ''}`}
          onClick={() => toggleFavorite(set.id)}
        >
          <Star size={18} fill={isFav ? 'var(--stage-visium)' : 'none'} stroke={isFav ? 'var(--stage-visium)' : 'currentColor'} />
          <span>{isFav ? (lang === 'he' ? 'הסר מהלוח שלי' : 'Remove from My Schedule') : (lang === 'he' ? 'הוסף ללוח שלי' : 'Add to My Schedule')}</span>
        </button>
      </div>
    </div>
  );
}

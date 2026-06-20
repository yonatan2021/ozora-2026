import { useState, useRef, useEffect } from 'react';
import { X, Star, MapPin, Clock, Tag, CalendarPlus, ChevronDown } from 'lucide-react';
import { translations } from '../utils/lang';
import { getCalendarPlatform, generateGoogleCalendarUrl, generateICSFile } from '../utils/calendar';

export default function SetModal({ set, lang, favorites, toggleFavorite, onClose }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (!set) return null;
  const t = translations[lang];
  const isFav = favorites.includes(set.id);
  const platform = getCalendarPlatform();

  const handleAddToCalendar = () => {
    if (platform === 'apple') {
      generateICSFile(set);
    } else {
      window.open(generateGoogleCalendarUrl(set), '_blank');
    }
  };

  const handleDropdownSelect = (type) => {
    if (type === 'google') {
      window.open(generateGoogleCalendarUrl(set), '_blank');
    } else {
      generateICSFile(set);
    }
    setDropdownOpen(false);
  };

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

        <div className="modal-calendar-wrapper" ref={dropdownRef}>
          <div className="modal-calendar-btn-group">
            <button className="modal-calendar-btn" onClick={handleAddToCalendar}>
              <CalendarPlus size={18} />
              <span>{lang === 'he' ? 'הוסף ליומן' : 'Add to Calendar'}</span>
            </button>
            <button
              className="modal-calendar-dropdown-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Calendar options"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          {dropdownOpen && (
            <div className="modal-calendar-dropdown">
              <button onClick={() => handleDropdownSelect('google')}>
                Google Calendar
              </button>
              <button onClick={() => handleDropdownSelect('apple')}>
                Apple Calendar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

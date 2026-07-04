import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Star, MapPin, Clock, Tag, CalendarPlus, ChevronDown, MessageSquare, Map as MapIcon, Music } from 'lucide-react';
import { translations } from '../utils/lang';
import { getCalendarPlatform, generateGoogleCalendarUrl, generateICSFile } from '../utils/calendar';
import { getNote, setNote as saveNote, NOTE_MAX_LENGTH } from '../utils/notes';
import { getSetUniqueKey } from '../utils/time';
import { trackEvent } from '../utils/analytics';
import ArtistNameWithFlags from './ArtistNameWithFlags';

export default function SetModal({ set, lang, favorites, toggleFavorite, onClose, onNoteChanged, onShowOnMap }) {
  const setKey = useMemo(() => set ? getSetUniqueKey(set) : null, [set]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => setKey ? getNote(setKey) : '');
  const [prevSetKey, setPrevSetKey] = useState(setKey);
  const dropdownRef = useRef(null);

  if (setKey !== prevSetKey) {
    setPrevSetKey(setKey);
    setNoteText(setKey ? getNote(setKey) : '');
  }

  const openTimeRef = useRef(null);
  const activeSetRef = useRef(null);

  useEffect(() => {
    if (activeSetRef.current && openTimeRef.current) {
      const durationMs = Date.now() - openTimeRef.current;
      trackEvent('artist_modal_close', {
        artist_name: activeSetRef.current.artist,
        duration_seconds: Math.round(durationMs / 1000)
      });
      openTimeRef.current = null;
    }

    activeSetRef.current = set;

    if (set) {
      openTimeRef.current = Date.now();
    }

    return () => {
      if (activeSetRef.current && openTimeRef.current) {
        const durationMs = Date.now() - openTimeRef.current;
        trackEvent('artist_modal_close', {
          artist_name: activeSetRef.current.artist,
          duration_seconds: Math.round(durationMs / 1000)
        });
        openTimeRef.current = null;
      }
    };
  }, [set]);

  useEffect(() => {
    if (set) {
      trackEvent('artist_modal_open', {
        artist_name: set.artist,
        stage_name: set.stage,
        day_name: set.day
      });
    }
  }, [set]);

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

  const handleNoteBlur = () => {
    saveNote(setKey, noteText);
    trackEvent('artist_note_save', {
      artist_name: set.artist,
      note_length: noteText.length
    });
    if (onNoteChanged) onNoteChanged();
  };

  const handleAddToCalendar = () => {
    trackEvent('add_to_calendar', {
      artist_name: set.artist,
      method: platform === 'apple' ? 'apple_ics' : 'google_url'
    });
    if (platform === 'apple') {
      generateICSFile(set);
    } else {
      window.open(generateGoogleCalendarUrl(set), '_blank');
    }
  };

  const handleDropdownSelect = (type) => {
    trackEvent('add_to_calendar', {
      artist_name: set.artist,
      method: type === 'google' ? 'google_url' : 'apple_ics'
    });
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

        <h2 className="modal-artist">
          <ArtistNameWithFlags artist={set.artist} />
        </h2>

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

        <div className="modal-note-section">
          <div className="modal-note-label">
            <MessageSquare size={14} />
            <span>{t.noteLabel}</span>
          </div>
          <input
            type="text"
            className="modal-note-input"
            placeholder={t.notePlaceholder}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value.slice(0, NOTE_MAX_LENGTH))}
            onBlur={handleNoteBlur}
            maxLength={NOTE_MAX_LENGTH}
          />
          <span className="modal-note-counter">{noteText.length}/{NOTE_MAX_LENGTH}</span>
        </div>

        <button
          className={`modal-fav-btn ${isFav ? 'active' : ''}`}
          onClick={() => toggleFavorite(set.id, 'modal')}
        >
          <Star size={18} fill={isFav ? 'var(--stage-visium)' : 'none'} stroke={isFav ? 'var(--stage-visium)' : 'currentColor'} />
          <span>{isFav ? (lang === 'he' ? 'הסר מהלוח שלי' : 'Remove from My Schedule') : (lang === 'he' ? 'הוסף ללוח שלי' : 'Add to My Schedule')}</span>
        </button>

        {onShowOnMap && (
          <button
            className="modal-fav-btn"
            onClick={() => { onShowOnMap(set.stage); onClose(); }}
          >
            <MapIcon size={18} />
            <span>{lang === 'he' ? 'הצג במפה' : 'Show on map'}</span>
          </button>
        )}

        <div className="modal-music-links">
          <button
            className="modal-fav-btn"
            onClick={() => {
              trackEvent('listen_music', { platform: 'youtube', artist_name: set.artist });
              window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(set.artist)}+music`, '_blank', 'noopener,noreferrer');
            }}
          >
            <Music size={18} />
            <span>{t.listenYouTube}</span>
          </button>
          <button
            className="modal-fav-btn"
            onClick={() => {
              trackEvent('listen_music', { platform: 'soundcloud', artist_name: set.artist });
              window.open(`https://soundcloud.com/search?q=${encodeURIComponent(set.artist)}`, '_blank', 'noopener,noreferrer');
            }}
          >
            <Music size={18} />
            <span>{t.listenSoundCloud}</span>
          </button>
        </div>

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

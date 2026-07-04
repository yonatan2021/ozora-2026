import { useDeferredValue, useMemo, useState, useEffect, useRef } from 'react';
import { Search, X, Star, Clock, Sparkles, User, Tag } from 'lucide-react';
import { searchSchedule } from '../utils/search';
import { translations } from '../utils/lang';
import { trackEvent } from '../utils/analytics';
import { getNotes } from '../utils/notes';
import { getFriends } from '../utils/friends';
import { getSetStatus, parseSetDateTime } from '../utils/time';
import ArtistNameWithFlags from './ArtistNameWithFlags';

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

const RECENT_KEY = 'ozora_recent_searches';

export default function SearchBar({ 
  lang, 
  timetableData, 
  favorites, 
  toggleFavorite, 
  onSelectSet,
  evalTime
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const t = translations[lang];

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      setRecentSearches(saved);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Save search to history helper
  const saveSearchToHistory = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(x => x.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearch = (e, indexToRemove) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
  };

  // Load context for search query logic
  const searchContext = useMemo(() => {
    let prioritiesObj = {};
    try {
      prioritiesObj = JSON.parse(localStorage.getItem('ozora_priorities')) || {};
    } catch {}

    return {
      notes: getNotes(),
      friends: getFriends(),
      favorites: favorites,
      priorities: prioritiesObj,
      lang: lang
    };
  }, [favorites, lang]);

  // Check if query matches a quick command/tag
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed === '') return [];

    const currentEvalTime = evalTime || Date.now();
    const evalDate = new Date(currentEvalTime);

    if (trimmed === 'live' || trimmed === 'now playing' || trimmed === 'מנגנים עכשיו' || trimmed === 'לייב') {
      return timetableData
        .filter(set => {
          if (!set.date || !set.start || !set.end) return false;
          const status = getSetStatus(set, evalDate);
          return status === 'active';
        })
        .map(set => ({ ...set, matchReason: { type: 'special', detail: lang === 'he' ? 'בלייב עכשיו' : 'Playing Live Now' } }));
    }

    if (trimmed === 'upcoming' || trimmed === 'next up' || trimmed === 'הבאים בתור') {
      return timetableData
        .filter(set => {
          if (!set.date || !set.start || !set.end) return false;
          const status = getSetStatus(set, evalDate);
          if (status !== 'future') return false;
          const startObj = parseSetDateTime(set.date, set.start);
          const diff = startObj.getTime() - evalDate.getTime();
          return diff > 0 && diff <= 3 * 60 * 60 * 1000; // Next 3 hours
        })
        .map(set => ({ ...set, matchReason: { type: 'special', detail: lang === 'he' ? 'הבא בתור' : 'Next Up' } }));
    }

    if (trimmed === 'favorites' || trimmed === 'my schedule' || trimmed === 'הלוח שלי') {
      return timetableData
        .filter(set => favorites.includes(set.id))
        .map(set => ({ ...set, matchReason: { type: 'special', detail: lang === 'he' ? 'בלוח שלך' : 'On your schedule' } }));
    }

    return searchSchedule(query, timetableData, searchContext);
  }, [query, timetableData, searchContext, favorites, evalTime, lang]);

  const deferredQuery = useDeferredValue(query);
  useEffect(() => {
    if (deferredQuery.trim() === '') return;
    const timer = setTimeout(() => {
      trackEvent('search_artist', { search_query: deferredQuery, results_count: results.length });
    }, 500);
    return () => clearTimeout(timer);
  }, [deferredQuery, results.length]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setActiveIndex(prev => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setActiveIndex(prev => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      } else if (query.trim()) {
        saveSearchToHistory(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (set) => {
    trackEvent('select_search_result', {
      artist_name: set.artist,
      stage_name: set.stage,
      day_name: set.day
    });
    saveSearchToHistory(set.artist);
    onSelectSet(set);
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const quickFilters = useMemo(() => [
    { id: 'live', label: lang === 'he' ? '⚡ בלייב' : '⚡ Live', query: lang === 'he' ? 'לייב' : 'live' },
    { id: 'upcoming', label: lang === 'he' ? '🕒 הבאים בתור' : '🕒 Next Up', query: lang === 'he' ? 'הבאים בתור' : 'next up' },
    { id: 'mysched', label: lang === 'he' ? '⭐ הלוח שלי' : '⭐ My Schedule', query: lang === 'he' ? 'הלוח שלי' : 'my schedule' },
    { id: 'ozora', label: '🎪 Ozora Stage', query: 'Ozora Stage' },
    { id: 'pumpui', label: '🎪 Pumpui', query: 'Pumpui' },
    { id: 'dome', label: '🎪 The Dome', query: 'The Dome' },
    { id: 'trance', label: '🎵 Trance', query: 'Trance' },
    { id: 'ambient', label: '🎵 Ambient', query: 'Ambient' },
    { id: 'chill', label: '🎵 Chill', query: 'Chill' }
  ], [lang]);

  const handleQuickTagClick = (tagQuery) => {
    setQuery(tagQuery);
    setIsOpen(true);
    inputRef.current?.focus();
    trackEvent('search_quick_tag', { tag: tagQuery });
  };

  const renderMatchReason = (reason) => {
    if (!reason) return null;
    
    let icon = null;
    let text = '';

    switch (reason.type) {
      case 'related':
        icon = <Sparkles size={12} className="reason-icon text-accent" />;
        text = lang === 'he' ? `קשור ל-${reason.detail}` : `Related to ${reason.detail}`;
        break;
      case 'note':
        icon = <Clock size={12} className="reason-icon text-info" />;
        text = lang === 'he' ? `הערה שלך: "${reason.detail}"` : `My note: "${reason.detail}"`;
        break;
      case 'coordination_note':
        icon = <User size={12} className="reason-icon text-info" />;
        text = lang === 'he' ? `מפגש של ${reason.detail}` : `Meet: ${reason.detail}`;
        break;
      case 'friend':
        icon = <User size={12} className="reason-icon text-success" />;
        text = lang === 'he' ? `בלוח של ${reason.detail}` : `On ${reason.detail}'s schedule`;
        break;
      case 'priority':
        icon = <Tag size={12} className="reason-icon text-warning" />;
        text = lang === 'he' ? `עדיפות: ${reason.detail}` : `Priority: ${reason.detail}`;
        break;
      case 'special':
        icon = <Sparkles size={12} className="reason-icon text-accent" />;
        text = reason.detail;
        break;
      default:
        return null;
    }

    return (
      <div className="search-match-reason">
        {icon}
        <span className="reason-text">{text}</span>
      </div>
    );
  };

  return (
    <div 
      className="search-bar-container" 
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ direction: lang === 'he' ? 'rtl' : 'ltr' }}
    >
      <div className="search-input-wrapper">
        <Search className="search-icon-left" size={18} />
        <input 
          ref={inputRef}
          type="text" 
          placeholder={t.searchPlaceholder} 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="search-input"
        />
        {query && (
          <button 
            type="button" 
            className="search-clear-btn" 
            onClick={handleClear}
            title={lang === 'he' ? 'נקה חיפוש' : 'Clear Search'}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-dropdown">
          {query.trim() === '' ? (
            <div className="search-dropdown-menu-sections">
              {recentSearches.length > 0 && (
                <div className="search-menu-section">
                  <div className="search-menu-section-header">
                    <span>{t.recentSearches}</span>
                    <button 
                      type="button" 
                      className="search-menu-clear-all" 
                      onClick={clearAllRecent}
                    >
                      {t.clearHistory}
                    </button>
                  </div>
                  <ul className="search-history-list">
                    {recentSearches.map((term, index) => (
                      <li 
                        key={index} 
                        className="search-history-item"
                        onClick={() => handleQuickTagClick(term)}
                      >
                        <Clock size={14} className="history-icon" />
                        <span className="history-term">{term}</span>
                        <button 
                          type="button" 
                          className="history-delete-btn"
                          onClick={(e) => clearRecentSearch(e, index)}
                        >
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="search-menu-section">
                <div className="search-menu-section-header">
                  <span>{t.quickFilters}</span>
                </div>
                <div className="quick-filters-scroll">
                  {quickFilters.map(filter => (
                    <button
                      key={filter.id}
                      type="button"
                      className="quick-filter-chip"
                      onClick={() => handleQuickTagClick(filter.query)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="search-dropdown-header">
                <span>
                  {lang === 'he' 
                    ? `תוצאות חיפוש (${results.length})` 
                    : `Search Results (${results.length})`}
                </span>
              </div>

              {results.length === 0 ? (
                <div className="search-dropdown-empty">
                  <p>{t.noSetsFound}</p>
                  <span className="search-suggestion-hint">
                    {lang === 'he'
                      ? 'נסה לחפש באנגלית, בעברית, לפי סגנון, הערות אישיות או שם חבר/ה'
                      : 'Try searching in English, Hebrew, by genre, personal notes or a friend\'s name'}
                  </span>
                </div>
              ) : (
                <ul className="search-dropdown-list">
                  {results.map((set, index) => {
                    const isFav = favorites.includes(set.id);
                    const isActive = index === activeIndex;
                    const stageClass = STAGE_CLASSES[set.stage] || 'stage-generic';

                    const currentEvalTime = evalTime || Date.now();
                    const status = (set.date && set.start && set.end)
                      ? getSetStatus(set, new Date(currentEvalTime))
                      : null;

                    return (
                      <li 
                        key={set.id}
                        className={`search-dropdown-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleSelect(set)}
                      >
                        <div className="search-item-info">
                          <div className="search-item-artist-row">
                            <div className="search-item-artist">
                              <ArtistNameWithFlags artist={set.artist} />
                            </div>
                            {status === 'active' && (
                              <span className="live-status-pulse-badge">
                                <span className="live-pulse-dot"></span>
                                <span className="live-badge-text">{lang === 'he' ? 'לייב' : 'LIVE'}</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="search-item-meta">
                            <span className={`search-item-stage-badge ${stageClass}`}>
                              {set.stage}
                            </span>
                            <span className="search-item-divider">•</span>
                            <span className="search-item-day">
                              {lang === 'he' ? set.day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון') : set.day}
                            </span>
                            <span className="search-item-divider">•</span>
                            <span className="search-item-time">{set.start} - {set.end}</span>
                          </div>

                          {renderMatchReason(set.matchReason)}
                        </div>
                        <button 
                          type="button"
                          className="search-item-fav-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(set.id, 'search');
                          }}
                          title={isFav ? (lang === 'he' ? 'הסר מהלוח שלי' : 'Remove from My Schedule') : (lang === 'he' ? 'הוסף ללוח שלי' : 'Add to My Schedule')}
                        >
                          <Star 
                            size={16} 
                            fill={isFav ? 'var(--stage-visium)' : 'none'} 
                            stroke={isFav ? 'var(--stage-visium)' : 'currentColor'} 
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { useDeferredValue, useMemo, useState, useEffect, useRef } from 'react';
import { Search, X, Star } from 'lucide-react';
import { searchSchedule } from '../utils/search';
import { translations } from '../utils/lang';
import { trackEvent } from '../utils/analytics';

// Helper to determine the CSS class based on the stage name
const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function SearchBar({ 
  lang, 
  timetableData, 
  favorites, 
  toggleFavorite, 
  onSelectSet 
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(query);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const t = translations[lang];

  const results = useMemo(() => {
    if (deferredQuery.trim() === '') return [];
    return searchSchedule(deferredQuery, timetableData);
  }, [deferredQuery, timetableData]);

  // Reset keyboard focus when the displayed query results change.
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Track search activity after the query settles.
  useEffect(() => {
    if (deferredQuery.trim() === '') return;
    const timer = setTimeout(() => {
      trackEvent('search_artist', { search_query: deferredQuery, results_count: results.length });
    }, 500);
    return () => clearTimeout(timer);
  }, [deferredQuery, results.length]);

  // Click outside listener to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
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
    onSelectSet(set);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
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

      {isOpen && query.trim() !== '' && (
        <div className="search-dropdown">
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
                  ? 'נסה לחפש באנגלית, בעברית, או לפי שם הבמה'
                  : 'Try searching in English, Hebrew, or by stage name'}
              </span>
            </div>
          ) : (
            <ul className="search-dropdown-list">
              {results.map((set, index) => {
                const isFav = favorites.includes(set.id);
                const isActive = index === activeIndex;
                const stageClass = STAGE_CLASSES[set.stage] || 'stage-generic';

                return (
                  <li 
                    key={set.id}
                    className={`search-dropdown-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelect(set)}
                  >
                    <div className="search-item-info">
                      <div className="search-item-artist">{set.artist}</div>
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
                    </div>
                    <button 
                      type="button"
                      className="search-item-fav-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent selecting the set
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
        </div>
      )}
    </div>
  );
}

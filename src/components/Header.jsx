import { useState, useEffect, useRef } from 'react';
import { Languages, Calendar, BookOpen, User, Map as MapIcon, Tent, Palette, Sparkles, Radio, Sun, Sunset, Moon, Sunrise, Lock } from 'lucide-react';
import { translations } from '../utils/lang';
import SearchBar from './SearchBar';
import logo from '../assets/logo.png';
import CountdownBanner from './CountdownBanner';

const THEMES = [
  { id: 'theme-day', icon: Sun, labelKey: 'themeDay' },
  { id: 'theme-sunset', icon: Sunset, labelKey: 'themeSunset' },
  { id: 'theme-night', icon: Moon, labelKey: 'themeNight' },
  { id: 'theme-sunrise', icon: Sunrise, labelKey: 'themeSunrise' },
];

export default function Header({ 
  lang, 
  setLang, 
  timetableData,
  favorites,
  toggleFavorite,
  onSelectSet,
  activeTab,
  setActiveTab,
  hasCamp,
  onCampClick,
  pinnedTheme,
  setPinnedTheme,
  activeThemeClass,
  onOpenLiveModal,
  evalTime
}) {
  const t = translations[lang];
  const isHe = lang === 'he';
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-top">
        <h1 className="brand-title">
          <img
            src={logo}
            alt={t.title}
            className="brand-logo"
            width="1000"
            height="545"
            decoding="async"
            fetchPriority="high"
          />
        </h1>
        
        {/* Desktop/Tablet view Navigation Tabs */}
        <div className="desktop-view-only">
          <div className="desktop-nav-tabs">
            <button 
              className={`tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => setActiveTab('timetable')}
            >
              <Calendar size={16} />
              <span>{isHe ? 'לוח הופעות' : 'Timetable'}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <User size={16} />
              <span>{isHe ? 'הלוח שלי' : 'My Schedule'}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <MapIcon size={16} />
              <span>{isHe ? 'מפה' : 'Map'}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
              onClick={() => setActiveTab('guide')}
            >
              <BookOpen size={16} />
              <span>{isHe ? 'מדריך פסטיבל' : 'Festival Guide'}</span>
            </button>
          </div>
        </div>

        <div className="header-actions">
          {hasCamp && (
            <button 
              className="camp-shortcut-btn" 
              onClick={onCampClick}
              title={isHe ? 'ניווט לאוהל שלי' : 'Navigate to my camp'}
            >
              <Tent size={18} />
            </button>
          )}

          {/* What's Playing Now Button */}
          <button
            className="live-status-toggle"
            onClick={onOpenLiveModal}
            title={isHe ? '?מה מנגן עכשיו' : "What's Playing Now?"}
          >
            <Radio size={18} className="live-radio-icon animate-pulse" />
            <span>{isHe ? 'לייב' : 'Live'}</span>
          </button>

          {/* Theme / Background Selector */}
          <div className="theme-dropdown-container" ref={dropdownRef}>
            <button 
              className="theme-dropdown-toggle"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title={t.themeLabel}
            >
              <Palette size={18} />
              <span>{t.themeLabel}</span>
            </button>
            
            {showThemeMenu && (
              <div className="theme-dropdown-menu">
                <button
                  className={`theme-dropdown-item ${!pinnedTheme ? 'active' : ''}`}
                  onClick={() => {
                    setPinnedTheme(null);
                    setShowThemeMenu(false);
                  }}
                >
                  <Sparkles size={16} />
                  <span>{t.themeAuto}</span>
                </button>
                {THEMES.map(({ id, icon: Icon, labelKey }) => (
                  <button
                    key={id}
                    className={`theme-dropdown-item ${pinnedTheme === id ? 'active' : ''} ${activeThemeClass === id && !pinnedTheme ? 'current' : ''}`}
                    onClick={() => {
                      setPinnedTheme(pinnedTheme === id ? null : id);
                      setShowThemeMenu(false);
                    }}
                  >
                    {pinnedTheme === id ? <Lock size={12} className="theme-lock-icon" /> : <Icon size={16} />}
                    <span>{t[labelKey]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            className="lang-toggle" 
            onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
            title="Change Language"
          >
            <Languages size={18} />
            <span>{lang === 'en' ? 'עברית' : 'English'}</span>
          </button>
        </div>
      </div>

      <CountdownBanner lang={lang} />

      <SearchBar 
        lang={lang}
        timetableData={timetableData}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        onSelectSet={onSelectSet}
        evalTime={evalTime}
      />
    </header>
  );
}

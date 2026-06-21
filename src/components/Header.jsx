import { Languages, Calendar, BookOpen, User } from 'lucide-react';
import { translations } from '../utils/lang';
import SearchBar from './SearchBar';
import logo from '../assets/logo.png';

export default function Header({ 
  lang, 
  setLang, 
  timetableData,
  favorites,
  toggleFavorite,
  onSelectSet,
  activeTab,
  setActiveTab
}) {
  const t = translations[lang];
  const isHe = lang === 'he';

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
              className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
              onClick={() => setActiveTab('guide')}
            >
              <BookOpen size={16} />
              <span>{isHe ? 'מדריך פסטיבל' : 'Festival Guide'}</span>
            </button>
          </div>
        </div>

        <div className="header-actions">
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

      <SearchBar 
        lang={lang}
        timetableData={timetableData}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        onSelectSet={onSelectSet}
      />
    </header>
  );
}

import React from 'react';
import { Star, Languages } from 'lucide-react';
import { translations } from '../utils/lang';

export default function Header({ 
  lang, 
  setLang, 
  searchQuery, 
  setSearchQuery, 
  showFavoritesOnly, 
  setShowFavoritesOnly 
}) {
  const t = translations[lang];

  return (
    <header className="app-header">
      <div className="header-top">
        <h1 className="brand-title">{t.title}</h1>
        <div className="header-actions">
          <button 
            className={`fav-toggle ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title={t.favoritesOnly}
          >
            <Star size={18} fill={showFavoritesOnly ? 'var(--stage-visium)' : 'none'} stroke={showFavoritesOnly ? 'var(--stage-visium)' : 'currentColor'} />
            <span>{t.favoritesOnly}</span>
          </button>
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

      <div className="search-bar-container">
        <input 
          type="text" 
          placeholder={t.searchPlaceholder} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          dir={lang === 'he' ? 'rtl' : 'ltr'}
        />
      </div>
    </header>
  );
}

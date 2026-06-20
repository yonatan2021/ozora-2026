import React, { useState, useEffect } from 'react';
import timetableData from './data/timetable.json';
import Header from './components/Header';
import TimeSimulator from './components/TimeSimulator';
import TimetableGrid from './components/TimetableGrid';
import ChronologicalFeed from './components/ChronologicalFeed';
import SetModal from './components/SetModal';
import { getSetStatus } from './utils/time';
import { translations } from './utils/lang';

export default function App() {
  const [lang, setLang] = useState('he');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('ozora_favs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedDay, setSelectedDay] = useState('DAY 1');
  const [isSimulated, setIsSimulated] = useState(false);
  const [simTime, setSimTime] = useState(new Date('2026-07-27T20:00:00').getTime()); // Start of DAY 1
  const [activeStatusMap, setActiveStatusMap] = useState({});
  const [selectedSet, setSelectedSet] = useState(null);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('ozora_favs', JSON.stringify(favorites));
  }, [favorites]);

  // Update active set statuses
  useEffect(() => {
    const statusMap = {};
    const evalTime = isSimulated ? new Date(simTime) : new Date();
    
    // In real-time mode, override year to 2026 for simulation/convenience
    if (!isSimulated) {
      evalTime.setFullYear(2026);
    }

    timetableData.forEach(set => {
      statusMap[set.id] = getSetStatus(set, evalTime);
    });
    setActiveStatusMap(statusMap);
  }, [isSimulated, simTime]);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Filter sets based on selected filters
  const filteredSets = timetableData.filter(set => {
    // 1. Day Filter (Only filter by day if not showing favorites only, or let favorites show all days, or keep day filter. Day filter is great for grid views!)
    if (set.day !== selectedDay) return false;

    // 2. Search Query Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const artistMatch = set.artist.toLowerCase().includes(query);
      const stageMatch = set.stage.toLowerCase().includes(query);
      const typeMatch = set.type.toLowerCase().includes(query);
      if (!artistMatch && !stageMatch && !typeMatch) return false;
    }

    // 3. Favorites Filter
    if (showFavoritesOnly && !favorites.includes(set.id)) return false;

    return true;
  });

  // Unique days list sorted by date
  const days = Array.from(new Set(timetableData.map(s => s.day)));

  const t = translations[lang];

  return (
    <div className="app-container" style={{ direction: lang === 'he' ? 'rtl' : 'ltr' }}>
      <Header 
        lang={lang} 
        setLang={setLang}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
      />

      <TimeSimulator 
        lang={lang}
        simTime={simTime}
        setSimTime={setSimTime}
        isSimulated={isSimulated}
        setIsSimulated={setIsSimulated}
      />

      {/* Days Selector */}
      <div className="days-selector">
        {days.map(d => (
          <button 
            key={d} 
            className={`day-btn ${selectedDay === d ? 'active' : ''}`}
            onClick={() => setSelectedDay(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <main className="main-content">
        {filteredSets.length === 0 ? (
          <div className="empty-state">
            <p>{showFavoritesOnly && favorites.length === 0 ? t.favoritesEmpty : t.noSetsFound}</p>
          </div>
        ) : (
          <>
            {/* Desktop and Tablet grid view */}
            <div className="desktop-view-only">
              <TimetableGrid 
                sets={filteredSets}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSetClick={setSelectedSet}
                activeStatusMap={activeStatusMap}
              />
            </div>
            
            {/* Mobile feed list */}
            <div className="mobile-view-only">
              <ChronologicalFeed 
                sets={filteredSets}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onSetClick={setSelectedSet}
                activeStatusMap={activeStatusMap}
              />
            </div>
          </>
        )}
      </main>

      <SetModal 
        set={selectedSet}
        lang={lang}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        onClose={() => setSelectedSet(null)}
      />
    </div>
  );
}

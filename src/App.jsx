import { useState, useEffect } from 'react';
import timetableData from './data/timetable.json';
import Header from './components/Header';
import TimeSimulator from './components/TimeSimulator';
import TimetableGrid from './components/TimetableGrid';
import ChronologicalFeed from './components/ChronologicalFeed';
import SetModal from './components/SetModal';
import LiveStatusModal from './components/LiveStatusModal';
import MySchedule from './components/MySchedule';
import FestivalGuide from './components/FestivalGuide';
import { getSetStatus, getSetUniqueKey, migrateFavorites } from './utils/time';
import { translations } from './utils/lang';
import CountdownBanner from './components/CountdownBanner';
import PsychedelicBackground from './components/PsychedelicBackground';
import { Calendar, User, BookOpen } from 'lucide-react';
import CookieConsent from './components/CookieConsent';
import { getStoredConsent, initializeGA4 } from './utils/consent';

const DAY_DATE_LABELS = {
  'Warmup Sat': { he: 'חימום שבת · 25/7', en: 'Warmup Sat · 25/7' },
  'Warmup Sun': { he: 'חימום ראשון · 26/7', en: 'Warmup Sun · 26/7' },
  'DAY 1': { he: 'יום 1 · שני 27/7', en: 'Day 1 · Mon 27/7' },
  'DAY 2': { he: 'יום 2 · שלישי 28/7', en: 'Day 2 · Tue 28/7' },
  'DAY 3': { he: 'יום 3 · רביעי 29/7', en: 'Day 3 · Wed 29/7' },
  'DAY 4': { he: 'יום 4 · חמישי 30/7', en: 'Day 4 · Thu 30/7' },
  'DAY 5': { he: 'יום 5 · שישי 31/7', en: 'Day 5 · Fri 31/7' },
  'DAY 6': { he: 'יום 6 · שבת 1/8', en: 'Day 6 · Sat 1/8' },
  'DAY 7': { he: 'יום 7 · ראשון 2/8', en: 'Day 7 · Sun 2/8' },
  'DAY 8': { he: 'יום 8 · שני 3/8', en: 'Day 8 · Mon 3/8' },
};

const DATE_TO_DAY_MAP = {
  '2026-07-25': 'Warmup Sat',
  '2026-07-26': 'Warmup Sun',
  '2026-07-27': 'DAY 1',
  '2026-07-28': 'DAY 2',
  '2026-07-29': 'DAY 3',
  '2026-07-30': 'DAY 4',
  '2026-07-31': 'DAY 5',
  '2026-08-01': 'DAY 6',
  '2026-08-02': 'DAY 7',
  '2026-08-03': 'DAY 8'
};

const STAGES = [
  "OZORA STAGE",
  "PUMPUI",
  "THE DOME",
  "DRAGON NEST / COOKING GROOVE",
  "VISIUM GARDEN",
  "TEK ZERO (2000s Trance)"
];

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('ozora_lang');
    return saved === 'en' ? 'en' : 'he';
  });
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'favorites' | 'guide'
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('ozora_favs');
    const parsed = saved ? JSON.parse(saved) : [];
    let currentFavs = migrateFavorites(parsed, timetableData);

    // Import shared favorites from URL on initial load
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      const indices = shareParam.split(',').map(Number).filter(n => !isNaN(n));
      const importedKeys = [];
      indices.forEach(idx => {
        const set = timetableData[idx];
        if (set) {
          importedKeys.push(getSetUniqueKey(set));
        }
      });
      if (importedKeys.length > 0) {
        const merged = new Set([...currentFavs, ...importedKeys]);
        currentFavs = Array.from(merged);
      }
    }
    return currentFavs;
  });
  
  const [selectedDay, setSelectedDay] = useState('Warmup Sat');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [isSimulated, setIsSimulated] = useState(() => {
    return localStorage.getItem('ozora_simulated') === 'true';
  });
  const [simTime, setSimTime] = useState(() => {
    const saved = localStorage.getItem('ozora_sim_time');
    return saved ? parseInt(saved, 10) : new Date('2026-07-27T14:00:00').getTime();
  });
  const [selectedSet, setSelectedSet] = useState(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initialize Google Analytics if consent was already given
  useEffect(() => {
    const consent = getStoredConsent();
    if (consent && consent.analytics) {
      initializeGA4();
    }
  }, []);

  // Sync lang to localStorage
  useEffect(() => {
    localStorage.setItem('ozora_lang', lang);
  }, [lang]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('ozora_favs', JSON.stringify(favorites));
  }, [favorites]);

  // Sync simulator states to localStorage
  useEffect(() => {
    localStorage.setItem('ozora_simulated', String(isSimulated));
  }, [isSimulated]);

  useEffect(() => {
    localStorage.setItem('ozora_sim_time', String(simTime));
  }, [simTime]);

  // Handle URL cleanup and toast notification for shared favorites
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      const indices = shareParam.split(',').map(Number).filter(n => !isNaN(n));
      const hasValidSets = indices.some(idx => timetableData[idx]);
      if (hasValidSets) {
        setTimeout(() => {
          setToastMessage(lang === 'he' ? 'לוח ההופעות ששותף איתך התווסף למועדפים!' : 'Shared schedule added to your favorites!');
        }, 50);
      }

      // Clean the URL address bar
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [lang]);

  // Auto-dismiss toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Synchronize simulated time date with selected day (Slider -> Calendar)
  useEffect(() => {
    if (isSimulated) {
      const dateObj = new Date(simTime);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = DATE_TO_DAY_MAP[dateStr];
      if (dayName && dayName !== selectedDay) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedDay(dayName);
      }
    }
  }, [simTime, isSimulated, selectedDay]);

  // Synchronize selected day change with simulated time (Calendar -> Slider)
  const handleDayChange = (dayName) => {
    setSelectedDay(dayName);
    if (isSimulated) {
      const dateStr = Object.keys(DATE_TO_DAY_MAP).find(key => DATE_TO_DAY_MAP[key] === dayName);
      if (dateStr) {
        const currentDate = new Date(simTime);
        const [year, month, day] = dateStr.split('-').map(Number);
        
        const newSimDate = new Date(currentDate);
        newSimDate.setFullYear(year);
        newSimDate.setMonth(month - 1);
        newSimDate.setDate(day);
        
        setSimTime(newSimDate.getTime());
      }
    }
  };

  // Derive active set statuses directly in render
  const activeStatusMap = {};
  const evalTime = isSimulated ? new Date(simTime) : new Date();
  
  // In real-time mode, override year to 2026 for simulation/convenience
  if (!isSimulated) {
    evalTime.setFullYear(2026);
  }

  timetableData.forEach(set => {
    activeStatusMap[set.id] = getSetStatus(set, evalTime);
  });

  const toggleFavorite = (id) => {
    const matchedSet = timetableData.find(s => s.id === id);
    if (!matchedSet) return;
    const key = getSetUniqueKey(matchedSet);
    setFavorites(prev => 
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const childFavorites = timetableData
    .filter(set => favorites.includes(getSetUniqueKey(set)))
    .map(set => set.id);

  // Filter sets based on selected day
  const filteredSets = timetableData.filter(set => set.day === selectedDay);

  // Filter sets for mobile chronological view based on selected stage
  const mobileFilteredSets = filteredSets.filter(set => 
    selectedStage === 'ALL' || set.stage === selectedStage
  );

  // Unique days list sorted by date
  const days = Array.from(new Set(timetableData.map(s => s.day)));
  const t = translations[lang];

  const handleSelectSetFromSearch = (set) => {
    setActiveTab('timetable');
    handleDayChange(set.day);
    setSelectedStage(set.stage);
    setSelectedSet(set);
    
    // Smooth scroll and flash highlight effect
    setTimeout(() => {
      const cardId = `set-card-${set.id}`;
      const feedId = `feed-set-${set.id}`;
      const element = document.getElementById(cardId) || document.getElementById(feedId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-flash');
        setTimeout(() => {
          element.classList.remove('highlight-flash');
        }, 2500);
      }
    }, 200);
  };

  // Dynamic theme classifier based on simulated or current time
  const getThemeClass = (ts) => {
    const hour = new Date(ts).getHours();
    if (hour >= 20 || hour < 5) {
      return 'theme-night';
    } else if (hour >= 5 && hour < 7) {
      return 'theme-sunrise';
    } else if (hour >= 7 && hour < 18) {
      return 'theme-day';
    } else {
      return 'theme-sunset';
    }
  };
  const activeThemeClass = getThemeClass(simTime);

  return (
    <div className={`app-container ${activeThemeClass}`} style={{ direction: lang === 'he' ? 'rtl' : 'ltr' }}>
      <PsychedelicBackground themeClass={activeThemeClass} />
      <CountdownBanner lang={lang} />

      <Header
        lang={lang}
        setLang={setLang}
        timetableData={timetableData}
        favorites={childFavorites}
        toggleFavorite={toggleFavorite}
        onSelectSet={handleSelectSetFromSearch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Render Tab Contents */}
      {activeTab === 'timetable' && (
        <>
          <TimeSimulator
            lang={lang}
            simTime={simTime}
            setSimTime={setSimTime}
            isSimulated={isSimulated}
            setIsSimulated={setIsSimulated}
            onOpenLiveModal={() => setIsLiveModalOpen(true)}
          />

          {/* Days Selector */}
          <div className="days-selector stagger-slide-up" style={{ '--card-index': 0 }}>
            {days.map(d => (
              <button 
                key={d} 
                className={`day-btn ${selectedDay === d ? 'active' : ''}`}
                onClick={() => handleDayChange(d)}
              >
                {DAY_DATE_LABELS[d]?.[lang === 'he' ? 'he' : 'en'] || d}
              </button>
            ))}
          </div>

          {/* Mobile Stage Selector & Legend */}
          <div className="stages-selector mobile-view-only stagger-slide-up" style={{ '--card-index': 0.5 }}>
            <button 
              className={`stage-filter-btn all-stages ${selectedStage === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedStage('ALL')}
            >
              <span className="stage-legend-dot stage-all-dot"></span>
              <span>{t.allStages}</span>
            </button>
            {STAGES.map(stage => {
              const stageClass = STAGE_CLASSES[stage];
              const displayName = stage
                .replace(' / COOKING GROOVE', '')
                .replace(' (2000s Trance)', '');
              return (
                <button 
                  key={stage} 
                  className={`stage-filter-btn ${stageClass} ${selectedStage === stage ? 'active' : ''}`}
                  onClick={() => setSelectedStage(stage)}
                >
                  <span className="stage-legend-dot"></span>
                  <span>{displayName}</span>
                </button>
              );
            })}
          </div>

          <main className="main-content">
            {filteredSets.length === 0 ? (
              <div className="empty-state">
                <p>{t.noSetsFound}</p>
              </div>
            ) : (
              <>
                 {/* Desktop and Tablet grid view */}
                <div className="desktop-view-only">
                  <TimetableGrid
                    lang={lang}
                    sets={filteredSets}
                    favorites={childFavorites}
                    toggleFavorite={toggleFavorite}
                    onSetClick={setSelectedSet}
                    activeStatusMap={activeStatusMap}
                    simTime={simTime}
                  />
                </div>
                
                {/* Mobile feed list */}
                <div className="mobile-view-only">
                  {mobileFilteredSets.length === 0 ? (
                    <div className="empty-state">
                      <p>{t.noSetsFound}</p>
                    </div>
                  ) : (
                    <ChronologicalFeed 
                      sets={mobileFilteredSets}
                      favorites={childFavorites}
                      toggleFavorite={toggleFavorite}
                      onSetClick={setSelectedSet}
                      activeStatusMap={activeStatusMap}
                    />
                  )}
                </div>
              </>
            )}
          </main>
        </>
      )}

      {activeTab === 'favorites' && (
        <MySchedule 
          lang={lang}
          timetableData={timetableData}
          favorites={childFavorites}
          toggleFavorite={toggleFavorite}
          onSetClick={setSelectedSet}
          simTime={simTime}
          isSimulated={isSimulated}
          onShowToast={setToastMessage}
        />
      )}

      {activeTab === 'guide' && (
        <FestivalGuide />
      )}

      {/* Bottom Navigation for Mobile Devices */}
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav-btn ${activeTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveTab('timetable')}
        >
          <Calendar size={20} />
          <span>{lang === 'he' ? 'לוח הופעות' : 'Timetable'}</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <User size={20} />
          <span>{lang === 'he' ? 'הלוח שלי' : 'My Schedule'}</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          <BookOpen size={20} />
          <span>{lang === 'he' ? 'מדריך' : 'Guide'}</span>
        </button>
      </nav>

      <SetModal 
        set={selectedSet}
        lang={lang}
        favorites={childFavorites}
        toggleFavorite={toggleFavorite}
        onClose={() => setSelectedSet(null)}
      />

      <LiveStatusModal 
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        lang={lang}
        simTime={simTime}
        timetableData={timetableData}
        onSelectSet={handleSelectSetFromSearch}
      />

      {toastMessage && (
        <div className="toast-notification-container">
          <div className="toast-notification">
            {toastMessage}
          </div>
        </div>
      )}

      <CookieConsent lang={lang} />
    </div>
  );
}

import { lazy, Suspense, useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
import SacredGeometry from './components/SacredGeometry';
import { Calendar, User, BookOpen, Heart, Map as MapIcon } from 'lucide-react';
import CookieConsent from './components/CookieConsent';
import InstallPrompt from './components/InstallPrompt';
import FooterInstallCTA from './components/FooterInstallCTA';
import ImportModal from './components/ImportModal';
import { initializeGA4 } from './utils/consent';
import { saveFriend } from './utils/friends';
import { trackEvent } from './utils/analytics';

const VenueMap = lazy(() => import('./components/VenueMap'));

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

const TIMETABLE_SETS_BY_ID = new Map(timetableData.map(set => [set.id, set]));
const TIMETABLE_SETS_BY_KEY = new Map(timetableData.map(set => [getSetUniqueKey(set), set]));
const DAYS = Array.from(new Set(timetableData.map(set => set.day)));
const SETS_BY_DAY = timetableData.reduce((acc, set) => {
  if (!acc[set.day]) acc[set.day] = [];
  acc[set.day].push(set);
  return acc;
}, {});

export default function App() {
  const isInitialLang = useRef(true);
  const isInitialSim = useRef(true);
  
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('ozora_lang');
    return saved === 'en' ? 'en' : 'he';
  });
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'favorites' | 'map' | 'guide'
  const [flyToStageId, setFlyToStageId] = useState(null);
  const mapViewStateRef = useRef(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('ozora_favs');
    const parsed = saved ? JSON.parse(saved) : [];
    return migrateFavorites(parsed, timetableData);
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
  const [notesVersion, setNotesVersion] = useState(0);
  const [hasCamp, setHasCamp] = useState(() => !!localStorage.getItem('ozora_my_camp'));

  // Periodically check if a camp is pinned/removed (safeguard since storage event doesn't fire in the same window)
  useEffect(() => {
    const handleStorage = () => {
      setHasCamp(!!localStorage.getItem('ozora_my_camp'));
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const [pinnedTheme, setPinnedTheme] = useState(() => {
    return localStorage.getItem('ozora_pinned_theme') || null;
  });
  const [debouncedThemeClass, setDebouncedThemeClass] = useState(() => {
    const saved = localStorage.getItem('ozora_pinned_theme');
    if (saved) return saved;
    const savedTime = localStorage.getItem('ozora_sim_time');
    const ts = savedTime ? parseInt(savedTime, 10) : new Date('2026-07-27T14:00:00').getTime();
    const hour = new Date(ts).getHours();
    if (hour >= 20 || hour < 5) return 'theme-night';
    if (hour >= 5 && hour < 7) return 'theme-sunrise';
    if (hour >= 7 && hour < 18) return 'theme-day';
    return 'theme-sunset';
  });
  const themeDebounceRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      const indices = shareParam.split(',').map(Number).filter(n => !isNaN(n));
      const sharedSets = indices
        .map(idx => timetableData[idx])
        .filter(Boolean);
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      if (sharedSets.length > 0) return sharedSets;
    }
    return null;
  });

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Initialize Google Analytics (Consent Mode defaults to denied if not yet accepted)
  useEffect(() => {
    initializeGA4();
  }, []);

  // Track tab views
  useEffect(() => {
    trackEvent('tab_view', { tab_name: activeTab });
  }, [activeTab]);

  // Sync lang to localStorage & track change
  useEffect(() => {
    localStorage.setItem('ozora_lang', lang);
    if (isInitialLang.current) {
      isInitialLang.current = false;
    } else {
      trackEvent('change_language', { target_language: lang });
    }
  }, [lang]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('ozora_favs', JSON.stringify(favorites));
  }, [favorites]);

  // Sync simulator states to localStorage & track change
  useEffect(() => {
    localStorage.setItem('ozora_simulated', String(isSimulated));
    if (isInitialSim.current) {
      isInitialSim.current = false;
    } else {
      trackEvent('toggle_simulation', { enabled: isSimulated });
    }
  }, [isSimulated]);

  useEffect(() => {
    localStorage.setItem('ozora_sim_time', String(simTime));
  }, [simTime]);

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
    trackEvent('select_day', { day_name: dayName });
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
  const activeStatusMap = useMemo(() => {
    const statuses = {};
    const evalTime = isSimulated ? new Date(simTime) : new Date();

    // In real-time mode, override year to 2026 for simulation/convenience
    if (!isSimulated) {
      evalTime.setFullYear(2026);
    }

    timetableData.forEach(set => {
      statuses[set.id] = getSetStatus(set, evalTime);
    });

    return statuses;
  }, [isSimulated, simTime]);

  const handleImportAll = () => {
    if (!pendingImport) return;
    trackEvent('import_schedule', { sets_count: pendingImport.length });
    const importedKeys = pendingImport.map(set => getSetUniqueKey(set));
    setFavorites(prev => {
      const merged = new Set([...prev, ...importedKeys]);
      return Array.from(merged);
    });
    setToastMessage(translations[lang].sharedScheduleImported);
    setPendingImport(null);
  };

  const handleSaveAsFriend = (friendName) => {
    if (!pendingImport) return;
    const keys = pendingImport.map(set => getSetUniqueKey(set));
    const saved = saveFriend(friendName, keys);
    if (saved) {
      trackEvent('save_friend', { sets_count: keys.length });
      setToastMessage(translations[lang].friendSaved);
    } else {
      setToastMessage(translations[lang].maxFriendsReached);
    }
    setPendingImport(null);
  };

  const handleStageChange = (stageName) => {
    setSelectedStage(stageName);
    trackEvent('select_stage', { stage_name: stageName });
  };

  const toggleFavorite = useCallback((id, origin = 'timetable') => {
    const matchedSet = TIMETABLE_SETS_BY_ID.get(id);
    if (!matchedSet) return;
    const key = getSetUniqueKey(matchedSet);
    const isFav = favoritesSet.has(key);
    trackEvent('toggle_favorite', {
      artist_name: matchedSet.artist,
      stage_name: matchedSet.stage,
      day_name: matchedSet.day,
      action: isFav ? 'remove' : 'add',
      origin
    });
    setFavorites(prev => 
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  }, [favoritesSet]);

  const childFavorites = useMemo(() => (
    favorites
      .map(key => TIMETABLE_SETS_BY_KEY.get(key)?.id)
      .filter(Boolean)
  ), [favorites]);

  // Filter sets based on selected day
  const filteredSets = useMemo(() => SETS_BY_DAY[selectedDay] || [], [selectedDay]);

  // Filter sets for mobile chronological view based on selected stage
  const mobileFilteredSets = useMemo(() => (
    selectedStage === 'ALL'
      ? filteredSets
      : filteredSets.filter(set => set.stage === selectedStage)
  ), [filteredSets, selectedStage]);

  // Unique days list sorted by date
  const days = DAYS;
  const t = translations[lang];

  const handleShowOnMap = useCallback((stageName) => {
    setFlyToStageId(stageName);
    setActiveTab('map');
    trackEvent('map_show_on_map', { stage_name: stageName });
  }, []);

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

  useEffect(() => {
    if (pinnedTheme) {
      localStorage.setItem('ozora_pinned_theme', pinnedTheme);
      setDebouncedThemeClass(pinnedTheme);
      return;
    }
    localStorage.removeItem('ozora_pinned_theme');
    const timeBasedTheme = getThemeClass(simTime);
    if (themeDebounceRef.current) clearTimeout(themeDebounceRef.current);
    themeDebounceRef.current = setTimeout(() => {
      setDebouncedThemeClass(timeBasedTheme);
    }, 600);
    return () => {
      if (themeDebounceRef.current) clearTimeout(themeDebounceRef.current);
    };
  }, [simTime, pinnedTheme]);

  const activeThemeClass = debouncedThemeClass;

  return (
    <div className={`app-container ${activeThemeClass}`} style={{ direction: lang === 'he' ? 'rtl' : 'ltr' }}>
      <PsychedelicBackground themeClass={activeThemeClass} />
      <SacredGeometry themeClass={activeThemeClass} />
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
        hasCamp={hasCamp}
        onCampClick={() => {
          setActiveTab('map');
          setFlyToStageId('my-camp');
        }}
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
            pinnedTheme={pinnedTheme}
            setPinnedTheme={setPinnedTheme}
            activeThemeClass={activeThemeClass}
            selectedDay={selectedDay}
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
              onClick={() => handleStageChange('ALL')}
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
                  onClick={() => handleStageChange(stage)}
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
                    days={days}
                    selectedDay={selectedDay}
                    onDayChange={handleDayChange}
                    dayLabels={DAY_DATE_LABELS}
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
          notesVersion={notesVersion}
        />
      )}

      {activeTab === 'map' && (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading map...</div>}>
          <VenueMap
            lang={lang}
            timetableData={timetableData}
            simTime={simTime}
            isSimulated={isSimulated}
            activeStatusMap={activeStatusMap}
            flyToStageId={flyToStageId}
            onFlyToComplete={() => setFlyToStageId(null)}
            onViewInTimetable={(set) => handleSelectSetFromSearch(set)}
            savedViewState={mapViewStateRef.current}
          />
        </Suspense>
      )}

      {activeTab === 'guide' && (
        <FestivalGuide />
      )}

      <footer className="app-footer">
        <FooterInstallCTA lang={lang} />
        <p className="footer-copyright">{t.copyright}</p>
        <p className="footer-credits">
          <span>{t.developedWithLove}</span>
          <Heart size={14} className="heart-icon" />
        </p>
      </footer>

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
          className={`bottom-nav-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <MapIcon size={20} />
          <span>{lang === 'he' ? 'מפה' : 'Map'}</span>
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
        onNoteChanged={() => setNotesVersion(v => v + 1)}
        onShowOnMap={handleShowOnMap}
      />

      <LiveStatusModal 
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        lang={lang}
        simTime={simTime}
        timetableData={timetableData}
        onSelectSet={handleSelectSetFromSearch}
      />

      {pendingImport && (
        <ImportModal
          sharedSets={pendingImport}
          lang={lang}
          onImportAll={handleImportAll}
          onSaveAsFriend={handleSaveAsFriend}
          onDismiss={() => setPendingImport(null)}
        />
      )}

      {toastMessage && (
        <div className="toast-notification-container">
          <div className="toast-notification">
            {toastMessage}
          </div>
        </div>
      )}

      <CookieConsent lang={lang} />
      <InstallPrompt lang={lang} />
    </div>
  );
}

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import timetableData from './data/timetable.json';
import Header from './components/Header';
import SetModal from './components/SetModal';
import LiveStatusModal from './components/LiveStatusModal';
import { getSetStatus, getSetUniqueKey } from './utils/time';
import { translations } from './utils/lang';
import PsychedelicBackground from './components/PsychedelicBackground';
import SacredGeometry from './components/SacredGeometry';
import { Calendar, User, BookOpen, Heart, Map as MapIcon } from 'lucide-react';
import CookieConsent from './components/CookieConsent';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import InstallPrompt from './components/InstallPrompt';
import FooterInstallCTA from './components/FooterInstallCTA';
import ImportModal from './components/ImportModal';
import { initializeGA4 } from './utils/consent';
import { saveFriend } from './utils/friends';
import { trackEvent } from './utils/analytics';
import useAppState from './hooks/useAppState';
import useTheme from './hooks/useTheme';
import useUrlSync, { DAY_MAP_INTERNAL_TO_URL } from './hooks/useUrlSync';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive activeTab dynamically from path
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/favorites')) return 'favorites';
    if (path.startsWith('/map')) return 'map';
    if (path.startsWith('/guide')) return 'guide';
    return 'timetable'; // Default / fallback
  }, [location.pathname]);

  const appState = useAppState();

  const {
    lang,
    setLang,
    favorites,
    setFavorites,
    toggleFavorite,
    childFavorites,
    toastMessage,
    setToastMessage,
    notesVersion,
    setNotesVersion,
    isLiveModalOpen,
    setIsLiveModalOpen,
    pendingImport,
    setPendingImport,
    hasCamp,
    handleCampChange,
    hasCookieConsent,
    setHasCookieConsent,
  } = appState;

  const evalTime = useMemo(() => {
    const d = new Date();
    d.setFullYear(2026);
    return d.getTime();
  }, []);

  const {
    pinnedTheme,
    setPinnedTheme,
    activeThemeClass,
  } = useTheme(evalTime);

  const {
    selectedDay,
    setSelectedDay,
    selectedStage,
    setSelectedStage,
    selectedSet,
    setSelectedSet,
  } = useUrlSync();

  const [flyToStageId, setFlyToStageId] = useState(null);
  const mapViewStateRef = useRef(null);

  // Initialize Google Analytics (Consent Mode defaults to denied if not yet accepted)
  useEffect(() => {
    initializeGA4();
  }, []);

  // Track tab views
  useEffect(() => {
    trackEvent('tab_view', { tab_name: activeTab });
  }, [activeTab]);

  // Derive active set statuses directly in render
  const activeStatusMap = useMemo(() => {
    const statuses = {};
    const evalDate = new Date(evalTime);

    timetableData.forEach(set => {
      statuses[set.id] = getSetStatus(set, evalDate);
    });

    return statuses;
  }, [evalTime]);

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

  const handleShowOnMap = useCallback((stageName) => {
    setFlyToStageId(stageName);
    navigate('/map');
    trackEvent('map_show_on_map', { stage_name: stageName });
  }, [navigate]);

  const handleSelectSetFromSearch = useCallback((set) => {
    const urlVal = DAY_MAP_INTERNAL_TO_URL[set.day];
    const params = new URLSearchParams();
    if (urlVal) params.set('day', urlVal);
    if (set.stage && set.stage !== 'ALL') params.set('stage', set.stage);
    params.set('set', set.id);
    navigate({ pathname: '/timetable', search: params.toString() });
    
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
  }, [navigate]);

  const contextValue = useMemo(() => ({
    lang,
    setLang,
    favorites,
    setFavorites,
    toggleFavorite,
    childFavorites,
    toastMessage,
    setToastMessage,
    notesVersion,
    setNotesVersion,
    isLiveModalOpen,
    setIsLiveModalOpen,
    pendingImport,
    setPendingImport,
    hasCamp,
    handleCampChange,
    hasCookieConsent,
    setHasCookieConsent,
    pinnedTheme,
    setPinnedTheme,
    activeThemeClass,
    selectedDay,
    setSelectedDay,
    selectedStage,
    setSelectedStage,
    selectedSet,
    setSelectedSet,
    activeStatusMap,
    flyToStageId,
    setFlyToStageId,
    mapViewStateRef,
    handleSelectSetFromSearch,
    evalTime,
  }), [
    lang,
    favorites,
    childFavorites,
    toastMessage,
    notesVersion,
    isLiveModalOpen,
    pendingImport,
    hasCamp,
    handleCampChange,
    hasCookieConsent,
    pinnedTheme,
    activeThemeClass,
    selectedDay,
    selectedStage,
    selectedSet,
    activeStatusMap,
    flyToStageId,
    mapViewStateRef,
    handleSelectSetFromSearch,
    evalTime,
  ]);

  const t = translations[lang];

  return (
    <div className={`app-container ${activeThemeClass}`} style={{ direction: lang === 'he' ? 'rtl' : 'ltr' }}>
      <PsychedelicBackground themeClass={activeThemeClass} selectedStage={selectedStage} />
      <SacredGeometry themeClass={activeThemeClass} selectedStage={selectedStage} />

      <Header
        lang={lang}
        setLang={setLang}
        timetableData={timetableData}
        favorites={childFavorites}
        toggleFavorite={toggleFavorite}
        onSelectSet={handleSelectSetFromSearch}
        activeTab={activeTab}
        setActiveTab={(tab) => navigate(`/${tab}`)}
        hasCamp={hasCamp}
        onCampClick={() => {
          navigate('/map');
          setFlyToStageId('my-camp');
        }}
        pinnedTheme={pinnedTheme}
        setPinnedTheme={setPinnedTheme}
        activeThemeClass={activeThemeClass}
        onOpenLiveModal={() => setIsLiveModalOpen(true)}
      />

      <Outlet context={contextValue} />

      <footer className="app-footer">
        <FooterInstallCTA lang={lang} />
        <p className="footer-disclaimer">{t.dataDisclaimer}</p>
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
          onClick={() => navigate('/timetable')}
        >
          <Calendar size={20} />
          <span>{lang === 'he' ? 'לוח הופעות' : 'Timetable'}</span>
        </button>
        <button
          className={`bottom-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => navigate('/favorites')}
        >
          <User size={20} />
          <span>{lang === 'he' ? 'הלוח שלי' : 'My Schedule'}</span>
        </button>
        <button
          className={`bottom-nav-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => navigate('/map')}
        >
          <MapIcon size={20} />
          <span>{lang === 'he' ? 'מפה' : 'Map'}</span>
        </button>
        <button
          className={`bottom-nav-btn ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => navigate('/guide')}
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
        simTime={evalTime}
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

      <CookieConsent lang={lang} onConsentResolved={() => setHasCookieConsent(true)} />
      {hasCookieConsent && <PWAUpdatePrompt lang={lang} />}
      <InstallPrompt lang={lang} />
    </div>
  );
}

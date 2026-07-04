import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import timetableData from '../data/timetable.json';
import StageLineupSelector from '../components/StageLineupSelector';
import StageListView from '../components/StageListView';
import TimetableGrid from '../components/TimetableGrid';
import ChronologicalFeed from '../components/ChronologicalFeed';
import { translations } from '../utils/lang';
import { trackEvent } from '../utils/analytics';

const DAY_DATE_LABELS = {
  'Warmup Sat': { he: 'יום -2 · 25/7', en: 'Day -2 · 25/7' },
  'Warmup Sun': { he: 'יום -1 · 26/7', en: 'Day -1 · 26/7' },
  'DAY 1': { he: 'יום 1 · 27/7', en: 'Day 1 · 27/7' },
  'DAY 2': { he: 'יום 2 · 28/7', en: 'Day 2 · 28/7' },
  'DAY 3': { he: 'יום 3 · 29/7', en: 'Day 3 · 29/7' },
  'DAY 4': { he: 'יום 4 · 30/7', en: 'Day 4 · 30/7' },
  'DAY 5': { he: 'יום 5 · 31/7', en: 'Day 5 · 31/7' },
  'DAY 6': { he: 'יום 6 · 1/8', en: 'Day 6 · 1/8' },
  'DAY 7': { he: 'יום 7 · 2/8', en: 'Day 7 · 2/8' },
  'DAY 8': { he: 'יום 8 · 3/8', en: 'Day 8 · 3/8' },
};

const DAYS = Array.from(new Set(timetableData.map(set => set.day)));
const SETS_BY_DAY = timetableData.reduce((acc, set) => {
  if (!acc[set.day]) acc[set.day] = [];
  acc[set.day].push(set);
  return acc;
}, {});

export default function TimetablePage() {
  const {
    lang,
    selectedDay,
    setSelectedDay,
    selectedStage,
    setSelectedStage,
    childFavorites,
    toggleFavorite,
    activeStatusMap,
    setSelectedSet,
    evalTime,
  } = useOutletContext();

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('ozora_view_mode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('ozora_view_mode', viewMode);
  }, [viewMode]);

  const handleDayChange = (dayName) => {
    setSelectedDay(dayName);
    trackEvent('timetable_filter_day', { day_name: dayName });
    const daySets = SETS_BY_DAY[dayName] || [];
    if (selectedStage !== 'ALL' && !daySets.some(s => s.stage === selectedStage)) {
      setSelectedStage('ALL');
    }
  };

  const handleStageChange = (stageName) => {
    setSelectedStage(stageName);
    trackEvent('timetable_filter_stage', { stage_name: stageName });
  };

  const filteredSets = useMemo(() => SETS_BY_DAY[selectedDay] || [], [selectedDay]);

  const stageFilteredSets = useMemo(() => (
    selectedStage === 'ALL'
      ? filteredSets
      : filteredSets.filter(set => set.stage === selectedStage)
  ), [filteredSets, selectedStage]);

  const t = translations[lang];

  return (
    <>
      {/* Days Selector */}
      <div className="days-selector stagger-slide-up" style={{ '--card-index': 0 }}>
        {DAYS.map(d => (
          <button
            key={d}
            className={`day-btn ${selectedDay === d ? 'active' : ''}`}
            onClick={() => handleDayChange(d)}
          >
            {DAY_DATE_LABELS[d]?.[lang === 'he' ? 'he' : 'en'] || d}
          </button>
        ))}
      </div>

      <StageLineupSelector
        sets={filteredSets}
        selectedStage={selectedStage}
        onChange={handleStageChange}
        lang={lang}
        favorites={childFavorites}
        toggleFavorite={toggleFavorite}
        activeStatusMap={activeStatusMap}
        onSetClick={setSelectedSet}
      />

      {/* View Mode Toggle */}
      <div className="view-mode-selector-container stagger-slide-up" style={{ '--card-index': 0.5 }}>
        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('grid');
              trackEvent('timetable_view_mode_change', { mode: 'grid' });
            }}
          >
            {t.viewModeGrid}
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'stages' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('stages');
              trackEvent('timetable_view_mode_change', { mode: 'stages' });
            }}
          >
            {t.viewModeStages}
          </button>
        </div>
      </div>

      <main className="main-content">
        {filteredSets.length === 0 ? (
          <div className="empty-state">
            <p>{t.noSetsFound}</p>
          </div>
        ) : viewMode === 'stages' ? (
          <StageListView
            lang={lang}
            sets={stageFilteredSets}
            favorites={childFavorites}
            toggleFavorite={toggleFavorite}
            onSetClick={setSelectedSet}
            activeStatusMap={activeStatusMap}
            selectedStage={selectedStage}
          />
        ) : (
          <>
            {/* Desktop and Tablet grid view */}
            <div className="desktop-view-only">
              <TimetableGrid
                lang={lang}
                sets={stageFilteredSets}
                favorites={childFavorites}
                toggleFavorite={toggleFavorite}
                onSetClick={setSelectedSet}
                activeStatusMap={activeStatusMap}
                simTime={evalTime}
                days={DAYS}
                selectedDay={selectedDay}
                onDayChange={handleDayChange}
                dayLabels={DAY_DATE_LABELS}
              />
            </div>
            
            {/* Mobile feed list */}
            <div className="mobile-view-only">
              {stageFilteredSets.length === 0 ? (
                <div className="empty-state">
                  <p>{t.noSetsFound}</p>
                </div>
              ) : (
                <ChronologicalFeed
                  sets={stageFilteredSets}
                  favorites={childFavorites}
                  toggleFavorite={toggleFavorite}
                  onSetClick={setSelectedSet}
                  activeStatusMap={activeStatusMap}
                />
              )}
              {DAYS.length > 1 && (() => {
                const currentIndex = DAYS.indexOf(selectedDay);
                const hasPrev = currentIndex > 0;
                const hasNext = currentIndex < DAYS.length - 1;
                const navigateToDay = (day) => {
                  handleDayChange(day);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                return (
                  <div className="mobile-day-nav">
                    <button
                      className="mobile-day-nav-btn"
                      disabled={!hasPrev}
                      onClick={() => { if (hasPrev) navigateToDay(DAYS[currentIndex - 1]); }}
                    >
                      <ChevronRight size={18} />
                      {hasPrev && <span>{DAY_DATE_LABELS[DAYS[currentIndex - 1]]?.[lang === 'he' ? 'he' : 'en'] || DAYS[currentIndex - 1]}</span>}
                    </button>
                    <button
                      className="mobile-day-nav-btn"
                      disabled={!hasNext}
                      onClick={() => { if (hasNext) navigateToDay(DAYS[currentIndex + 1]); }}
                    >
                      {hasNext && <span>{DAY_DATE_LABELS[DAYS[currentIndex + 1]]?.[lang === 'he' ? 'he' : 'en'] || DAYS[currentIndex + 1]}</span>}
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </main>
    </>
  );
}

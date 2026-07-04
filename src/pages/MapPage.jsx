import { Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router-dom';
import timetableData from '../data/timetable.json';

const VenueMap = lazy(() => import('../components/VenueMap'));

export default function MapPage() {
  const {
    lang,
    evalTime,
    activeStatusMap,
    flyToStageId,
    setFlyToStageId,
    handleSelectSetFromSearch,
    mapViewStateRef,
    handleCampChange,
  } = useOutletContext();

  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading map...</div>}>
      <VenueMap
        lang={lang}
        timetableData={timetableData}
        simTime={evalTime}
        isSimulated={false}
        activeStatusMap={activeStatusMap}
        flyToStageId={flyToStageId}
        onFlyToComplete={() => setFlyToStageId(null)}
        onViewInTimetable={handleSelectSetFromSearch}
        savedViewState={mapViewStateRef.current}
        onViewStateChange={(state) => { mapViewStateRef.current = state; }}
        onCampChange={handleCampChange}
      />
    </Suspense>
  );
}

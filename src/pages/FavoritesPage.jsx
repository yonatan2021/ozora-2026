import { useOutletContext } from 'react-router-dom';
import MySchedule from '../components/MySchedule';
import timetableData from '../data/timetable.json';

export default function FavoritesPage() {
  const {
    lang,
    childFavorites,
    toggleFavorite,
    setSelectedSet,
    evalTime,
    setToastMessage,
    notesVersion,
    activeThemeClass,
  } = useOutletContext();

  return (
    <MySchedule
      lang={lang}
      timetableData={timetableData}
      favorites={childFavorites}
      toggleFavorite={toggleFavorite}
      onSetClick={setSelectedSet}
      simTime={evalTime}
      isSimulated={false}
      onShowToast={setToastMessage}
      notesVersion={notesVersion}
      activeThemeClass={activeThemeClass}
    />
  );
}

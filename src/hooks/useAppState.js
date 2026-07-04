import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import timetableData from '../data/timetable.json';
import { getSetUniqueKey, migrateFavorites } from '../utils/time';
import { getStoredConsent } from '../utils/consent';
import { trackEvent } from '../utils/analytics';
import { translations } from '../utils/lang';
import { getMyScheduleId, getFriends, saveFriend } from '../utils/friends';
import { decompressPayload } from '../utils/shareSerialization';

const TIMETABLE_SETS_BY_ID = new Map(timetableData.map(set => [set.id, set]));
const TIMETABLE_SETS_BY_KEY = new Map(timetableData.map(set => [getSetUniqueKey(set), set]));

export default function useAppState() {
  const isInitialLang = useRef(true);

  // 1. Language state
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('ozora_lang');
    return saved === 'en' ? 'en' : 'he';
  });

  useEffect(() => {
    localStorage.setItem('ozora_lang', lang);
    if (isInitialLang.current) {
      isInitialLang.current = false;
    } else {
      trackEvent('language_change', { target_language: lang });
    }
  }, [lang]);

  // 2. Favorites state
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('ozora_favs');
    const parsed = saved ? JSON.parse(saved) : [];
    return migrateFavorites(parsed, timetableData);
  });

  useEffect(() => {
    localStorage.setItem('ozora_favs', JSON.stringify(favorites));
  }, [favorites]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

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

  // 3. Toast message state
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 4. Notes version state
  const [notesVersion, setNotesVersion] = useState(0);

  // 5. Live modal state
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  // 6. Pending import state
  const [pendingImport, setPendingImport] = useState(null);

  // 7. My unique schedule ID
  const myScheduleId = useMemo(() => getMyScheduleId(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      trackEvent('shared_link_opened');
      // Clean the URL immediately
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);

      const payload = decompressPayload(shareParam);
      if (payload && payload.id && Array.isArray(payload.sets)) {
        // Map set indices to composite keys, priorities, and notes
        const parsedSets = [];
        const parsedPriorities = {};
        const parsedNotes = {};

        payload.sets.forEach(([idx, priorityVal, noteText]) => {
          const set = timetableData[idx];
          if (set) {
            const setKey = getSetUniqueKey(set);
            parsedSets.push(setKey);
            if (priorityVal === 1) parsedPriorities[setKey] = 'must';
            else if (priorityVal === 2) parsedPriorities[setKey] = 'want';
            else if (priorityVal === 3) parsedPriorities[setKey] = 'maybe';
            if (noteText) parsedNotes[setKey] = noteText;
          }
        });

        const friends = getFriends();
        if (friends[payload.id]) {
          // Known friend — auto-update silently
          saveFriend(payload.id, {
            name: friends[payload.id].name, // preserve local name
            sets: parsedSets,
            priorities: parsedPriorities,
            notes: parsedNotes,
            coordinationNotes: payload.coord || {}
          });
          const friendName = friends[payload.id].name;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setToastMessage(
            translations[lang].friendScheduleUpdated.replace('{name}', friendName)
          );
        } else if (parsedSets.length > 0) {
          // Unknown friend — trigger import modal
          setPendingImport({
            id: payload.id,
            name: payload.name || '',
            sets: parsedSets,
            priorities: parsedPriorities,
            notes: parsedNotes,
            coordinationNotes: payload.coord || {}
          });
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 8. Has camp state
  const [hasCamp, setHasCamp] = useState(() => !!localStorage.getItem('ozora_my_camp'));

  const handleCampChange = useCallback(() => {
    setHasCamp(!!localStorage.getItem('ozora_my_camp'));
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setHasCamp(!!localStorage.getItem('ozora_my_camp'));
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // 9. Cookie consent state
  const [hasCookieConsent, setHasCookieConsent] = useState(() => !!getStoredConsent());

  return {
    lang,
    setLang,
    favorites,
    setFavorites,
    toggleFavorite,
    favoritesSet,
    childFavorites,
    toastMessage,
    setToastMessage,
    notesVersion,
    setNotesVersion,
    isLiveModalOpen,
    setIsLiveModalOpen,
    pendingImport,
    setPendingImport,
    myScheduleId,
    hasCamp,
    setHasCamp,
    handleCampChange,
    hasCookieConsent,
    setHasCookieConsent,
  };
}

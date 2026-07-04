import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import timetableData from '../data/timetable.json';

const DAY_MAP_INTERNAL_TO_URL = {
  'Warmup Sat': 'warmup-sat',
  'Warmup Sun': 'warmup-sun',
  'DAY 1': 'day-1',
  'DAY 2': 'day-2',
  'DAY 3': 'day-3',
  'DAY 4': 'day-4',
  'DAY 5': 'day-5',
  'DAY 6': 'day-6',
  'DAY 7': 'day-7',
  'DAY 8': 'day-8',
};

const DAY_MAP_URL_TO_INTERNAL = {
  'warmup-sat': 'Warmup Sat',
  'warmup-sun': 'Warmup Sun',
  'day-1': 'DAY 1',
  'day-2': 'DAY 2',
  'day-3': 'DAY 3',
  'day-4': 'DAY 4',
  'day-5': 'DAY 5',
  'day-6': 'DAY 6',
  'day-7': 'DAY 7',
  'day-8': 'DAY 8',
};

export default function useUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Day sync
  const urlDay = searchParams.get('day');
  const selectedDay = useMemo(() => {
    return DAY_MAP_URL_TO_INTERNAL[urlDay] || 'Warmup Sat';
  }, [urlDay]);

  const setSelectedDay = useCallback((day) => {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      const urlVal = DAY_MAP_INTERNAL_TO_URL[day];
      if (urlVal) {
        nextParams.set('day', urlVal);
      } else {
        nextParams.delete('day');
      }
      return nextParams;
    }, { replace: true });
  }, [setSearchParams]);

  // 2. Stage sync
  const selectedStage = searchParams.get('stage') || 'ALL';

  const setSelectedStage = useCallback((stage) => {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (stage && stage !== 'ALL') {
        nextParams.set('stage', stage);
      } else {
        nextParams.delete('stage');
      }
      return nextParams;
    }, { replace: true });
  }, [setSearchParams]);

  // 3. Set sync
  const urlSetId = searchParams.get('set');
  const selectedSet = useMemo(() => {
    if (!urlSetId) return null;
    return timetableData.find((s) => s.id === urlSetId) || null;
  }, [urlSetId]);

  const setSelectedSet = useCallback((set) => {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (set && set.id) {
        nextParams.set('set', set.id);
      } else {
        nextParams.delete('set');
      }
      return nextParams;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    selectedDay,
    setSelectedDay,
    selectedStage,
    setSelectedStage,
    selectedSet,
    setSelectedSet,
  };
}

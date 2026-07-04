import { useState, useEffect, useMemo } from 'react';

export default function useTheme(evalTime) {
  const [pinnedTheme, setPinnedTheme] = useState(() => {
    return localStorage.getItem('ozora_pinned_theme') || null;
  });

  useEffect(() => {
    if (pinnedTheme) {
      localStorage.setItem('ozora_pinned_theme', pinnedTheme);
    } else {
      localStorage.removeItem('ozora_pinned_theme');
    }
  }, [pinnedTheme]);

  const activeThemeClass = useMemo(() => {
    if (pinnedTheme) {
      return pinnedTheme;
    }
    const ts = evalTime || (() => {
      const d = new Date();
      d.setFullYear(2026);
      return d.getTime();
    })();
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
  }, [pinnedTheme, evalTime]);

  return {
    pinnedTheme,
    setPinnedTheme,
    activeThemeClass
  };
}

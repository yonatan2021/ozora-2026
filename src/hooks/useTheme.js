import { useState, useEffect, useRef, useMemo } from 'react';

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

  const lastThemeClassRef = useRef(localStorage.getItem('ozora_locked_theme_class') || 'theme-night');

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
    let theme = 'theme-night';
    if (hour >= 20 || hour < 5) {
      theme = 'theme-night';
    } else if (hour >= 5 && hour < 7) {
      theme = 'theme-sunrise';
    } else if (hour >= 7 && hour < 18) {
      theme = 'theme-day';
    } else {
      theme = 'theme-sunset';
    }
    lastThemeClassRef.current = theme;
    localStorage.setItem('ozora_locked_theme_class', theme);
    return theme;
  }, [pinnedTheme, evalTime]);

  return {
    pinnedTheme,
    setPinnedTheme,
    activeThemeClass
  };
}

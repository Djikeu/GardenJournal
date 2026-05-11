import { useEffect, useState, useCallback } from 'react';

/**
 * useTheme — light/dark toggle for the whole app.
 *
 * - Reads localStorage on mount; falls back to the user's OS preference
 * - Writes `data-theme="dark"` (or removes it) on <html>, so CSS overrides cascade
 * - Persists changes
 * - Listens to OS-level preference changes if the user hasn't picked manually
 */

const STORAGE_KEY = 'bj-theme';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (e) { /* ignore */ }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Apply immediately on first render so nothing flashes white
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // React to OS-level theme changes if user hasn't made an explicit choice
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== 'dark' && saved !== 'light') {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}

// Apply at module load so there's no flash of light theme before React mounts
applyTheme(getInitialTheme());

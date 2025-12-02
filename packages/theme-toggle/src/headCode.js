// Anti-flash theme initialization - must run synchronously before CSS
// This script should be placed inline in <head> before any stylesheets
(() => {
  'use strict';

  const STORAGE_KEY = 'theme';
  let theme = null;

  // Attempt to read stored theme from localStorage
  try {
    theme = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // localStorage unavailable (private browsing, etc.)
  }

  // Fallback to system preference if no stored theme
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  // Handle 'system' theme - resolve to actual light/dark
  if (theme === 'system') {
    const resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    document.documentElement.setAttribute('data-theme', 'system');
    document.documentElement.setAttribute('data-theme-resolved', resolved);
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
})();

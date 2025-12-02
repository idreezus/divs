// Anti-flash: inline in <head> before stylesheets
(() => {
  'use strict';

  const STORAGE_KEY = 'theme';
  let stored = null;

  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}

  // First visit or explicit "system" = system mode
  const isSystemSource = !stored || stored === 'system';

  // Calculate effective theme
  let effectiveTheme;
  if (isSystemSource) {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } else {
    effectiveTheme = stored;
  }

  // Set data-theme to effective theme (never "system")
  document.documentElement.setAttribute('data-theme', effectiveTheme);

  // Set boolean data-theme-system when source is system
  if (isSystemSource) {
    document.documentElement.setAttribute('data-theme-system', '');
  }
})();

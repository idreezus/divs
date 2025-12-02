/*!
 * Theme Toggle v1.0.0
 * A vanilla JavaScript theme switcher for light, dark, and custom themes.
 *
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 *
 * (c) 2025 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

(function () {
  'use strict';

  // Anti-flash: inline in <head> before stylesheets
  (() => {
    const STORAGE_KEY = 'theme';
    let stored = null;

    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    // User's choice: stored value or default to "system"
    const theme = stored || 'system';

    // Calculate effective theme
    const effectiveTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    // Set class on <html> for effective theme (CSS targeting)
    document.documentElement.classList.add(effectiveTheme);

    // Set data-theme attribute for user's choice (can be "system")
    document.documentElement.setAttribute('data-theme', theme);
  })();

})();

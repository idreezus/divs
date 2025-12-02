// Theme Manager - Declarative theme toggle with state management
// Core script handles state/logic only - developers control styling via CSS

import { CONFIG } from './config.js';

(() => {
  'use strict';

  const ThemeManager = {
    // Available themes - extend this array for multi-theme support
    themes: CONFIG.DEFAULTS.THEMES.slice(),

    // Current active theme
    current: null,

    // Initialization state
    initialized: false,

    // Internal storage for cleanup
    _toggles: [],
    _toggleListeners: new WeakMap(),
    _mediaQuery: null,
    _mediaQueryListener: null,

    // Returns the effective theme (resolves 'system' to actual light/dark)
    getEffectiveTheme(theme) {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return theme;
    },

    // Sets the active theme with validation
    setTheme(theme, options = {}) {
      const { force = false } = options;

      // Validate theme exists in array
      if (this.themes.indexOf(theme) === -1) {
        console.warn(
          `[ThemeManager] Theme "${theme}" not in themes array:`,
          this.themes
        );
        return this;
      }

      // Skip if already on this theme (unless forced)
      if (!force && theme === this.current) {
        return this;
      }

      // Check if effective theme would be the same
      const newEffective = this.getEffectiveTheme(theme);
      const currentEffective = this.getEffectiveTheme(this.current);
      const effectiveChanged = newEffective !== currentEffective;

      const previous = this.current;
      this.current = theme;

      // Handle 'system' theme - resolve to actual light/dark
      if (theme === 'system') {
        const resolved = this.getEffectiveTheme('system');
        document.documentElement.setAttribute('data-theme', 'system');
        document.documentElement.setAttribute('data-theme-resolved', resolved);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.removeAttribute('data-theme-resolved');
      }

      // Save to localStorage (with try/catch for private browsing)
      try {
        localStorage.setItem(CONFIG.STORAGE.KEY, theme);
      } catch (e) {
        console.warn('[ThemeManager] localStorage unavailable');
      }

      // Update all toggle buttons
      this.updateThemeButtons();

      // Only dispatch event if effective theme actually changed or theme selection changed
      if (effectiveChanged || previous !== theme) {
        window.dispatchEvent(
          new CustomEvent('themechange', {
            detail: {
              theme,
              previous,
              effectiveTheme: newEffective,
              effectiveChanged,
            },
          })
        );
      }

      return this;
    },

    // Returns the current theme
    getTheme() {
      return this.current;
    },

    // Cycles to the next theme in the array
    toggleTheme() {
      const currentIndex = this.themes.indexOf(this.current);
      const nextIndex = (currentIndex + 1) % this.themes.length;
      return this.setTheme(this.themes[nextIndex]);
    },

    // Updates all toggle button states and attributes
    updateThemeButtons() {
      const toggles = document.querySelectorAll(CONFIG.SELECTORS.TOGGLE);

      toggles.forEach((toggle) => {
        const toggleTheme = toggle.getAttribute('data-theme-toggle');
        const isActive = toggleTheme === this.current;

        // Set data attribute for CSS styling
        toggle.setAttribute('data-theme-active', isActive ? 'true' : 'false');

        // Set accessibility attributes
        toggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');

        if (toggleTheme) {
          toggle.setAttribute('aria-label', `${toggleTheme} theme`);

          // Auto-add title if not already set by developer
          if (!toggle.hasAttribute('title')) {
            toggle.setAttribute('title', `Switch to ${toggleTheme} theme`);
          }
        }
      });

      return this;
    },

    // Sets up toggle button click listeners
    _setupToggles() {
      const toggles = document.querySelectorAll(CONFIG.SELECTORS.TOGGLE);

      toggles.forEach((toggle) => {
        const toggleTheme = toggle.getAttribute('data-theme-toggle');

        const listener = () => {
          if (toggleTheme) {
            this.setTheme(toggleTheme);
          } else {
            this.toggleTheme();
          }
        };

        toggle.addEventListener('click', listener);

        // Store references for cleanup
        this._toggles.push(toggle);
        this._toggleListeners.set(toggle, listener);
      });
    },

    // Removes toggle button click listeners
    _teardownToggles() {
      this._toggles.forEach((toggle) => {
        const listener = this._toggleListeners.get(toggle);
        if (listener) {
          toggle.removeEventListener('click', listener);
          this._toggleListeners.delete(toggle);
        }
      });
      this._toggles = [];
    },

    // Initializes ThemeManager and attaches event listeners
    init() {
      if (this.initialized) {
        console.warn('[ThemeManager] Already initialized. Call destroy() first.');
        return this;
      }

      try {
        // Read initial theme from localStorage
        let stored = null;
        try {
          stored = localStorage.getItem(CONFIG.STORAGE.KEY);
        } catch (e) {
          // localStorage unavailable
        }

        // Use stored theme if valid, otherwise fallback to system preference
        if (stored && this.themes.indexOf(stored) !== -1) {
          this.current = stored;
        } else {
          this.current = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : CONFIG.DEFAULTS.FALLBACK_THEME;
        }

        // Ensure DOM matches (in case headCode didn't run)
        // Use force: true to ensure initial setup completes
        this.setTheme(this.current, { force: true });

        // Setup toggle button click listeners
        this._setupToggles();

        // Setup system preference sync
        this._setupSystemSync();

        this.initialized = true;
      } catch (e) {
        console.error('[ThemeManager] Initialization failed:', e);
      }

      return this;
    },

    // Sets up system preference change listener
    _setupSystemSync() {
      this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      this._mediaQueryListener = (e) => {
        // Only react if current theme is 'system'
        if (this.current === 'system') {
          const effectiveTheme = e.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme-resolved', effectiveTheme);

          // Update button states
          this.updateThemeButtons();

          // Dispatch event for developer animations
          window.dispatchEvent(
            new CustomEvent('themechange', {
              detail: {
                theme: 'system',
                previous: 'system',
                effectiveTheme,
                effectiveChanged: true,
              },
            })
          );
        }
      };

      this._mediaQuery.addEventListener('change', this._mediaQueryListener);
    },

    // Removes system preference change listener
    _teardownSystemSync() {
      if (this._mediaQuery && this._mediaQueryListener) {
        this._mediaQuery.removeEventListener('change', this._mediaQueryListener);
        this._mediaQuery = null;
        this._mediaQueryListener = null;
      }
    },

    // Re-scan DOM for toggle buttons (useful for SPAs)
    refresh() {
      if (!this.initialized) {
        console.warn('[ThemeManager] Not initialized. Call init() first.');
        return this;
      }

      // Remove existing listeners
      this._teardownToggles();

      // Re-setup toggles
      this._setupToggles();

      // Update button states
      this.updateThemeButtons();

      return this;
    },

    // Cleans up event listeners and resets state
    destroy() {
      if (!this.initialized) {
        return this;
      }

      // Remove toggle listeners
      this._teardownToggles();

      // Remove system sync listener
      this._teardownSystemSync();

      // Reset state
      this.current = null;
      this.initialized = false;

      return this;
    },
  };

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ThemeManager.init();
    });
  } else {
    ThemeManager.init();
  }

  // Expose to window
  if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
  }
})();

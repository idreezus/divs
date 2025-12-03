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

  (() => {
    // Config
    const ATTR_THEME = 'data-theme';
    const ATTR_TOGGLE = 'data-theme-toggle';
    const ATTR_VALUE = 'data-theme-value';
    const STORAGE_KEY = 'theme';
    const DEFAULT_THEMES = ['light', 'dark'];

    // Theme Manager
    const ThemeManager = {
      // Available themes - extend this array for multi-theme support
      themes: DEFAULT_THEMES.slice(),

      // Current effective theme (never "system")
      current: null,

      // User's theme choice (can be "system", "light", "dark", etc.)
      theme: null,

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
      setTheme(newTheme, options = {}) {
        const { force = false } = options;

        // Calculate effective theme
        const isSystemMode = newTheme === 'system';
        const newEffective = isSystemMode
          ? this.getEffectiveTheme('system')
          : newTheme;

        // Validate effective theme exists (skip validation for system mode)
        if (!isSystemMode && this.themes.indexOf(newTheme) === -1) {
          console.warn(
            `[ThemeManager] Theme "${newTheme}" not in themes array:`,
            this.themes
          );
          return this;
        }

        // Skip if no change (unless forced)
        if (!force && newEffective === this.current && newTheme === this.theme) {
          return this;
        }

        const previousEffective = this.current;
        const previousTheme = this.theme;

        this.current = newEffective;
        this.theme = newTheme;

        // Update class on <html> and <body> (remove old, add new)
        if (previousEffective) {
          document.documentElement.classList.remove(previousEffective);
          document.body.classList.remove(previousEffective);
        }
        document.documentElement.classList.add(newEffective);
        document.body.classList.add(newEffective);

        // Set data-theme attribute to user's choice (can be "system")
        document.documentElement.setAttribute(ATTR_THEME, newTheme);
        document.body.setAttribute(ATTR_THEME, newTheme);

        // Save user's choice to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, newTheme);
        } catch (e) {
          console.warn('[ThemeManager] localStorage unavailable');
        }

        // Dispatch event if there was any change
        const effectiveChanged = previousEffective !== newEffective;
        if (effectiveChanged || previousTheme !== newTheme || force) {
          window.dispatchEvent(
            new CustomEvent('themechange', {
              detail: {
                theme: newEffective,
                previous: previousEffective,
                userTheme: newTheme,
                previousUserTheme: previousTheme,
                effectiveChanged,
              },
            })
          );
        }

        return this;
      },

      // Returns the current effective theme
      getTheme() {
        return this.current;
      },

      // Returns the user's theme choice (can be "system")
      getUserTheme() {
        return this.theme;
      },

      // Returns the source for backwards compatibility
      getSource() {
        return this.theme === 'system' ? 'system' : 'user';
      },

      // Cycles to the next theme (skips "system")
      toggleTheme() {
        // Filter out "system" from cycle
        const cyclableThemes = this.themes.filter((t) => t !== 'system');

        const currentIndex = cyclableThemes.indexOf(this.current);
        const nextIndex =
          currentIndex === -1 ? 0 : (currentIndex + 1) % cyclableThemes.length;

        return this.setTheme(cyclableThemes[nextIndex]);
      },

      // Adds accessibility attributes if not already present
      _addA11yAttributes(btn, label) {
        if (!btn.hasAttribute('aria-label')) {
          btn.setAttribute('aria-label', label);
        }
        if (!btn.hasAttribute('title')) {
          btn.setAttribute('title', label);
        }
      },

      // Sets up toggle and value button click listeners
      _setupToggles() {
        // Setup data-theme-toggle (cycle)
        document.querySelectorAll(`[${ATTR_TOGGLE}]`).forEach((btn) => {
          this._addA11yAttributes(btn, 'Switch color theme');
          const listener = () => this.toggleTheme();
          btn.addEventListener('click', listener);
          this._toggles.push(btn);
          this._toggleListeners.set(btn, listener);
        });

        // Setup data-theme-value (explicit)
        document.querySelectorAll(`[${ATTR_VALUE}]`).forEach((btn) => {
          const theme = btn.getAttribute(ATTR_VALUE);
          this._addA11yAttributes(btn, `Switch to ${theme} color theme`);
          const listener = () => this.setTheme(theme);
          btn.addEventListener('click', listener);
          this._toggles.push(btn);
          this._toggleListeners.set(btn, listener);
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
          console.warn(
            '[ThemeManager] Already initialized. Call destroy() first.'
          );
          return this;
        }

        try {
          // Read user's theme choice from localStorage
          let stored = null;
          try {
            stored = localStorage.getItem(STORAGE_KEY);
          } catch (e) {
            // localStorage unavailable
          }

          // Default to "system" if no stored value
          const theme = stored || 'system';

          // Validate stored theme (allow "system" or any theme in array)
          if (theme !== 'system' && this.themes.indexOf(theme) === -1) {
            // Invalid stored theme - fallback to system
            this.theme = 'system';
          } else {
            this.theme = theme;
          }

          this.current = this.getEffectiveTheme(this.theme);

          // Ensure DOM matches (in case head-code didn't run)
          this.setTheme(this.theme, { force: true });

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
          // Only react if user chose system mode
          if (this.theme === 'system') {
            const newEffective = e.matches ? 'dark' : 'light';
            const previousEffective = this.current;

            this.current = newEffective;

            // Update class on <html> and <body>
            document.documentElement.classList.remove(previousEffective);
            document.documentElement.classList.add(newEffective);
            document.body.classList.remove(previousEffective);
            document.body.classList.add(newEffective);

            // Dispatch event for developer animations
            window.dispatchEvent(
              new CustomEvent('themechange', {
                detail: {
                  theme: newEffective,
                  previous: previousEffective,
                  userTheme: 'system',
                  previousUserTheme: 'system',
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
          this._mediaQuery.removeEventListener(
            'change',
            this._mediaQueryListener
          );
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
        this.theme = null;
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

})();
//# sourceMappingURL=theme-toggle.js.map

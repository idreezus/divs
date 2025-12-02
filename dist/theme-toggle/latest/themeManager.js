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

  // Data attribute names
  const ATTRIBUTES = {
    THEME: 'data-theme',
    THEME_SYSTEM: 'data-theme-system',
    TOGGLE: 'data-theme-toggle',
    VALUE: 'data-theme-value',
    ACTIVE: 'data-theme-active',
  };

  // Default configuration values
  const DEFAULTS = {
    THEMES: ['light', 'dark'],
    FALLBACK_THEME: 'light',
  };

  // localStorage configuration
  const STORAGE = {
    KEY: 'theme',
  };

  const CONFIG = {
    ATTRIBUTES,
    DEFAULTS,
    STORAGE,
  };

  // Theme Manager - Declarative theme toggle with state management
  // Core script handles state/logic only - developers control styling via CSS


  (() => {

    const ThemeManager = {
      // Available themes - extend this array for multi-theme support
      themes: CONFIG.DEFAULTS.THEMES.slice(),

      // Current effective theme (never "system")
      current: null,

      // Theme source: "user" or "system"
      source: null,

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

        // Determine if this is system mode
        const isSystemMode = theme === 'system';
        const newSource = isSystemMode ? 'system' : 'user';

        // Calculate effective theme
        const newEffective = isSystemMode
          ? this.getEffectiveTheme('system')
          : theme;

        // Validate effective theme exists (skip validation for system mode)
        if (!isSystemMode && this.themes.indexOf(theme) === -1) {
          console.warn(
            `[ThemeManager] Theme "${theme}" not in themes array:`,
            this.themes
          );
          return this;
        }

        // Skip if no change (unless forced)
        if (!force && newEffective === this.current && newSource === this.source) {
          return this;
        }

        const previousEffective = this.current;
        const previousSource = this.source;

        this.current = newEffective;
        this.source = newSource;

        // Update CSS class on <body> (remove old, add new)
        if (previousEffective) {
          document.body.classList.remove(previousEffective);
        }
        document.body.classList.add(newEffective);

        // Set data-theme attribute on <html> (always effective theme)
        document.documentElement.setAttribute(CONFIG.ATTRIBUTES.THEME, newEffective);

        // Handle data-theme-system (boolean attribute)
        if (isSystemMode) {
          document.documentElement.setAttribute(CONFIG.ATTRIBUTES.THEME_SYSTEM, '');
        } else {
          document.documentElement.removeAttribute(CONFIG.ATTRIBUTES.THEME_SYSTEM);
        }

        // Save to localStorage (with try/catch for private browsing)
        try {
          localStorage.setItem(CONFIG.STORAGE.KEY, isSystemMode ? 'system' : newEffective);
        } catch (e) {
          console.warn('[ThemeManager] localStorage unavailable');
        }

        // Update all toggle buttons
        this.updateThemeButtons();

        // Dispatch event if there was any change
        const effectiveChanged = previousEffective !== newEffective;
        if (effectiveChanged || previousSource !== newSource || force) {
          window.dispatchEvent(
            new CustomEvent('themechange', {
              detail: {
                theme: newEffective,
                previous: previousEffective,
                source: newSource,
                previousSource,
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

      // Returns the current source ("user" or "system")
      getSource() {
        return this.source;
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

      // Updates all toggle and value button states
      updateThemeButtons() {
        // Handle data-theme-value buttons
        document
          .querySelectorAll(`[${CONFIG.ATTRIBUTES.VALUE}]`)
          .forEach((btn) => {
            const btnTheme = btn.getAttribute(CONFIG.ATTRIBUTES.VALUE);

            let isActive = false;
            if (btnTheme === 'system') {
              // System button is active when source is system
              isActive = this.source === 'system';
            } else {
              // Theme button is active when it matches current effective theme
              isActive = btnTheme === this.current;
            }

            // Boolean attribute (present/absent)
            if (isActive) {
              btn.setAttribute(CONFIG.ATTRIBUTES.ACTIVE, '');
            } else {
              btn.removeAttribute(CONFIG.ATTRIBUTES.ACTIVE);
            }

            // Accessibility
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            if (!btn.hasAttribute('aria-label')) {
              btn.setAttribute('aria-label', `${btnTheme} theme`);
            }
          });

        // Handle data-theme-toggle buttons (never active)
        document
          .querySelectorAll(`[${CONFIG.ATTRIBUTES.TOGGLE}]`)
          .forEach((btn) => {
            btn.removeAttribute(CONFIG.ATTRIBUTES.ACTIVE);
            if (!btn.hasAttribute('aria-label')) {
              btn.setAttribute('aria-label', 'Toggle theme');
            }
          });

        return this;
      },

      // Sets up toggle and value button click listeners
      _setupToggles() {
        // Setup data-theme-toggle (cycle)
        document
          .querySelectorAll(`[${CONFIG.ATTRIBUTES.TOGGLE}]`)
          .forEach((btn) => {
            const listener = () => this.toggleTheme();
            btn.addEventListener('click', listener);
            this._toggles.push(btn);
            this._toggleListeners.set(btn, listener);
          });

        // Setup data-theme-value (explicit)
        document
          .querySelectorAll(`[${CONFIG.ATTRIBUTES.VALUE}]`)
          .forEach((btn) => {
            const theme = btn.getAttribute(CONFIG.ATTRIBUTES.VALUE);
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

          // First visit or explicit "system" = system mode
          const isSystemMode = !stored || stored === 'system';

          if (isSystemMode) {
            this.source = 'system';
            this.current = this.getEffectiveTheme('system');
          } else if (this.themes.indexOf(stored) !== -1) {
            this.source = 'user';
            this.current = stored;
          } else {
            // Invalid stored theme - fallback to system mode
            this.source = 'system';
            this.current = this.getEffectiveTheme('system');
          }

          // Ensure DOM matches (in case headCode didn't run)
          // Use force: true to ensure initial setup completes
          this.setTheme(isSystemMode ? 'system' : this.current, { force: true });

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
          // Only react if source is system
          if (this.source === 'system') {
            const newEffective = e.matches ? 'dark' : 'light';
            const previousEffective = this.current;

            this.current = newEffective;

            // Update DOM
            document.body.classList.remove(previousEffective);
            document.body.classList.add(newEffective);
            document.documentElement.setAttribute(
              CONFIG.ATTRIBUTES.THEME,
              newEffective
            );

            // Update button states
            this.updateThemeButtons();

            // Dispatch event for developer animations
            window.dispatchEvent(
              new CustomEvent('themechange', {
                detail: {
                  theme: newEffective,
                  previous: previousEffective,
                  source: 'system',
                  previousSource: 'system',
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
        this.source = null;
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
//# sourceMappingURL=themeManager.js.map

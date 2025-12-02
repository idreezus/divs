// Selectors for querying theme toggle elements
export const SELECTORS = {
  TOGGLE: '[data-theme-toggle]',
};

// Default configuration values
export const DEFAULTS = {
  THEMES: ['light', 'dark'],
  FALLBACK_THEME: 'light',
};

// localStorage configuration
export const STORAGE = {
  KEY: 'theme',
};

export const CONFIG = {
  SELECTORS,
  DEFAULTS,
  STORAGE,
};

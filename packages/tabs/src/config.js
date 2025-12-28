// Configuration constants for the tabs library

// Selectors for querying DOM elements
export const SELECTORS = {
  CONTAINER: '[data-tabs="container"]',
  TRIGGER: '[data-tabs-trigger-value]',
  PANEL: '[data-tabs-panel-value]',
  PREV_BTN: '[data-tabs="prev"]',
  NEXT_BTN: '[data-tabs="next"]',
  PLAY_PAUSE_BTN: '[data-tabs="play-pause"]',
};

// Attribute names for configuration
export const ATTRIBUTES = {
  // Container configuration
  GROUP_NAME: 'data-tabs-group-name',
  DEFAULT: 'data-tabs-default',
  ORIENTATION: 'data-tabs-orientation',
  ACTIVATE_ON_FOCUS: 'data-tabs-activate-on-focus',
  LOOP: 'data-tabs-loop',
  KEYBOARD: 'data-tabs-keyboard',

  // Content linking
  TRIGGER_VALUE: 'data-tabs-trigger-value',
  PANEL_VALUE: 'data-tabs-panel-value',

  // Autoplay configuration
  AUTOPLAY: 'data-tabs-autoplay',
  AUTOPLAY_DURATION: 'data-tabs-autoplay-duration',
  AUTOPLAY_PAUSE_HOVER: 'data-tabs-autoplay-pause-hover',
  AUTOPLAY_PAUSE_FOCUS: 'data-tabs-autoplay-pause-focus',
};

// CSS classes applied to elements
export const CLASSES = {
  // State classes
  ACTIVE: 'tabs-active',
  INACTIVE: 'tabs-inactive',
  TRANSITIONING: 'tabs-transitioning',

  // Panel transition classes
  PANEL_ENTERING: 'tabs-panel-entering',
  PANEL_LEAVING: 'tabs-panel-leaving',

  // Button state classes
  BUTTON_DISABLED: 'tabs-button-disabled',

  // Autoplay state classes
  AUTOPLAY_ACTIVE: 'tabs-autoplay-active',
  AUTOPLAY_PAUSED: 'tabs-autoplay-paused',

  // Accessibility
  REDUCED_MOTION: 'tabs-reduced-motion',
};

// CSS custom properties
export const CSS_VARS = {
  PROGRESS: '--tabs-progress',
  TAB_COUNT: '--tabs-count',
  TAB_INDEX: '--tabs-index',
  ACTIVE_INDEX: '--tabs-active-index',
  AUTOPLAY_DURATION: '--tabs-autoplay-duration',
  DIRECTION: '--tabs-direction',
};

// Default configuration values
export const DEFAULTS = {
  ORIENTATION: 'horizontal',
  ACTIVATE_ON_FOCUS: true,
  LOOP: false,
  KEYBOARD: true,
  AUTOPLAY: false,
  AUTOPLAY_DURATION: 5000,
  AUTOPLAY_PAUSE_HOVER: true,
  AUTOPLAY_PAUSE_FOCUS: true,
};

// Timing constants in milliseconds
export const TIMING = {
  TRANSITION_DURATION: 200,
};

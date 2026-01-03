// Configuration constants for the tabs library

// Selectors for querying DOM elements
export const selectors = {
  container: '[data-tabs="container"]',
  trigger: '[data-tabs-trigger-value]',
  panel: '[data-tabs-panel-value]',
  prevBtn: '[data-tabs="prev"]',
  nextBtn: '[data-tabs="next"]',
  playPauseBtn: '[data-tabs="play-pause"]',
};

// Attribute names for configuration
export const attributes = {
  // Container configuration
  groupName: 'data-tabs-group-name',
  default: 'data-tabs-default',
  orientation: 'data-tabs-orientation',
  activateOnFocus: 'data-tabs-activate-on-focus',
  loop: 'data-tabs-loop',
  keyboard: 'data-tabs-keyboard',
  id: 'data-tabs-id',

  // Content linking
  triggerValue: 'data-tabs-trigger-value',
  panelValue: 'data-tabs-panel-value',

  // Autoplay configuration
  autoplay: 'data-tabs-autoplay',
  autoplayDuration: 'data-tabs-autoplay-duration',
  autoplayPauseHover: 'data-tabs-autoplay-pause-hover',
  autoplayPauseFocus: 'data-tabs-autoplay-pause-focus',
};

// CSS classes applied to elements
export const classes = {
  // State classes
  active: 'tabs-active',
  inactive: 'tabs-inactive',
  transitioning: 'tabs-transitioning',

  // Panel transition classes
  panelEntering: 'tabs-panel-entering',
  panelLeaving: 'tabs-panel-leaving',

  // Button state classes
  buttonDisabled: 'tabs-button-disabled',

  // Autoplay state classes
  autoplayActive: 'tabs-autoplay-active',
  autoplayPaused: 'tabs-autoplay-paused',

  // Accessibility
  reducedMotion: 'tabs-reduced-motion',
};

// CSS custom properties
export const cssProps = {
  progress: '--tabs-progress',
  tabCount: '--tabs-count',
  tabIndex: '--tabs-index',
  activeIndex: '--tabs-active-index',
  autoplayDuration: '--tabs-autoplay-duration',
  direction: '--tabs-direction',
  transitionDuration: '--tabs-transition-duration',
};

// Default configuration values
export const defaults = {
  orientation: 'horizontal',
  activateOnFocus: true,
  loop: false,
  keyboard: true,
  autoplay: false,
  autoplayDuration: 5000,
  autoplayPauseHover: true,
  autoplayPauseFocus: true,
  transitionDuration: 200,
};

// Event names for CustomEvents
export const events = {
  change: 'change',
  autoplayStart: 'autoplay-start',
  autoplayPause: 'autoplay-pause',
};

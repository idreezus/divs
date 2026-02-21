// Configuration constants for the tabs library

// Builds a presence-based selector with opt-out support
const sel = (attr) => `[${attr}]:not([${attr}="false"])`;

// Raw attribute names for marker (presence-based) elements
export const selectorAttrs = {
  container: 'data-tabs-container',
  prevBtn: 'data-tabs-prev',
  nextBtn: 'data-tabs-next',
  playPauseBtn: 'data-tabs-play-pause',
};

// DOM query selectors (marker attrs auto-derived, value attrs manual)
export const selectors = {
  ...Object.fromEntries(
    Object.entries(selectorAttrs).map(([k, v]) => [k, sel(v)])
  ),
  trigger: '[data-tabs-trigger-id]',
  panel: '[data-tabs-panel-id]',
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
  triggerId: 'data-tabs-trigger-id',
  panelId: 'data-tabs-panel-id',

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
  playing: 'tabs-playing',

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
  autoplayPauseHover: false,
  autoplayPauseFocus: true,
  transitionDuration: 200,
};

// Event names for CustomEvents
export const events = {
  change: 'change',
  autoplayStart: 'autoplay-start',
  autoplayStop: 'autoplay-stop',
};

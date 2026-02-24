// Configuration constants for the tabs library

// Builds a presence-based selector with opt-out support
const sel = (attr: string): string => `[${attr}]:not([${attr}="false"])`;

// Raw attribute names for marker (presence-based) elements
const selectorAttrs: Record<string, string> = {
  container: 'data-tabs-container',
  list: 'data-tabs-list',
  playPauseBtn: 'data-tabs-play-pause',
};

// DOM query selectors (marker attrs auto-derived, value attrs manual)
export const selectors = {
  ...Object.fromEntries(
    Object.entries(selectorAttrs).map(([k, v]) => [k, sel(v)])
  ),
  trigger: '[data-tabs-trigger-id]',
  panel: '[data-tabs-panel-id]',
} as Record<string, string>;

// Attribute names for configuration
export const attributes = {
  // Container configuration
  groupName: 'data-tabs-url-param',
  default: 'data-tabs-default',
  list: 'data-tabs-list',
  id: 'data-tabs-id',

  // Content linking
  triggerId: 'data-tabs-trigger-id',
  panelId: 'data-tabs-panel-id',

  // Autoplay configuration
  autoplay: 'data-tabs-autoplay',
  autoplayDuration: 'data-tabs-autoplay-duration',
  autoplayPauseHover: 'data-tabs-pause-hover',
  autoplayPauseFocus: 'data-tabs-pause-focus',
};

// CSS classes applied to elements
export const classes = {
  // State classes
  active: 'tabs-active',
  transitioning: 'tabs-transitioning',

  // Panel transition classes
  panelEntering: 'tabs-panel-entering',
  panelLeaving: 'tabs-panel-leaving',

  // Scroll position state classes
  atStart: 'tabs-at-start',
  atEnd: 'tabs-at-end',

  // Autoplay state classes
  playing: 'tabs-playing',
};

// CSS custom properties
export const cssProps = {
  progress: '--tabs-progress',
  tabCount: '--tabs-count',
  tabIndex: '--tabs-index',
  activeIndex: '--tabs-active-index',
  autoplayDuration: '--tabs-autoplay-duration',
  direction: '--tabs-direction',
};

// Default configuration values
export const defaults = {
  autoplayDuration: 5000,
  transitionDuration: 200,
};

// Event names for CustomEvents
export const events = {
  change: 'change',
  autoplayStart: 'autoplay-start',
  autoplayStop: 'autoplay-stop',
};

// Configuration constants for the scroll-fade library

// Builds a presence-based selector with opt-out support
const sel = (attr) => `[${attr}]:not([${attr}="false"])`;

// Raw attribute names for marker (presence-based) elements
export const selectorAttrs = {
  container: 'data-scroll-fade-container',
  list: 'data-scroll-fade-list',
  prev: 'data-scroll-fade-prev',
  next: 'data-scroll-fade-next',
};

// DOM query selectors (marker attrs auto-derived, value attrs manual)
export const selectors = {
  ...Object.fromEntries(
    Object.entries(selectorAttrs).map(([k, v]) => [k, sel(v)])
  ),
  start: '[data-scroll-fade="start"]',
  end: '[data-scroll-fade="end"]',
};

// Attribute names for configuration
export const attributes = {
  // Container markers
  container: 'data-scroll-fade-container',
  list: 'data-scroll-fade-list',
  prev: 'data-scroll-fade-prev',
  next: 'data-scroll-fade-next',

  // Container configuration
  orientation: 'data-scroll-fade-orientation',
  step: 'data-scroll-fade-step',
  id: 'data-scroll-fade-id',
};

// CSS classes applied to elements
export const classes = {
  // Shadow visibility
  hidden: 'scroll-fade-hidden',

  // Button state
  buttonDisabled: 'scroll-fade-button-disabled',
};

// Event names for CustomEvents (prefixed with 'scroll-fade:' when dispatched)
export const events = {
  reachStart: 'reach-start',
  reachEnd: 'reach-end',
  show: 'show',
  hide: 'hide',
};

// Default configuration values
export const defaults = {
  orientation: 'horizontal',
  step: null, // Defaults to container clientWidth/clientHeight
};

// Internal constants
export const EDGE_THRESHOLD = 1; // pixels

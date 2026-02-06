// Configuration constants for the scroll-fade library

// Selectors for querying DOM elements
// Presence-based: attribute exists and value !== "false"
export const selectors = {
  container:
    '[data-scroll-fade-container]:not([data-scroll-fade-container="false"])',
  list: '[data-scroll-fade-list]:not([data-scroll-fade-list="false"])',
  start: '[data-scroll-fade="start"]',
  end: '[data-scroll-fade="end"]',
  prev: '[data-scroll-fade-prev]:not([data-scroll-fade-prev="false"])',
  next: '[data-scroll-fade-next]:not([data-scroll-fade-next="false"])',
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

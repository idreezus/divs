export const SELECTORS = {
  CONTAINER: '[data-carousel="container"]',
  TRACK: '[data-carousel="track"]',
  ITEM: '[data-carousel="item"]',
  PREV_BTN: '[data-carousel="prev"]',
  NEXT_BTN: '[data-carousel="next"]',
  DOT: '[data-carousel-dot]',
  PAGINATION_CURRENT: '[data-carousel-pagination-current]',
  PAGINATION_TOTAL: '[data-carousel-pagination-total]',
  PLAY_PAUSE_BTN: '[data-carousel-play-pause]',
};

// CSS classes applied to elements
export const CLASSES = {
  SCROLLING: 'carousel-scrolling', // Applied to track while user or programmatic scroll is active
  DISABLED: 'carousel-button-disabled', // Applied to buttons when at start/end edges
  ACTIVE: 'carousel-item-active', // Applied to the current active item
  VISIBLE: 'carousel-item-visible', // Applied to items currently in viewport (reserved for future use)
  ANIMATING: 'carousel-animating', // Applied to track during programmatic scroll
  SNAP_DISABLED: 'carousel-snap-disabled', // Applied to track to temporarily disable scroll-snap during button navigation
  DOT_ACTIVE: 'carousel-dot-active', // Applied to the current active pagination dot
  LIVE_REGION: 'carousel-sr-only', // Applied to the live region for screen readers
  AUTOPLAY_ACTIVE: 'carousel-autoplay-active',
  AUTOPLAY_PAUSED: 'carousel-autoplay-paused',
  REDUCED_MOTION: 'carousel-reduced-motion',
};

export const DEFAULTS = {
  ALIGN: 'start',
  KEYBOARD: false,
  SCROLL_BY: 'item',
  LOOP: false,
  AUTOPLAY: false,
  AUTOPLAY_DURATION: 5000,
  AUTOPLAY_PAUSE_HOVER: true,
  AUTOPLAY_PAUSE_FOCUS: true,
};

// Timing constants in milliseconds
export const TIMING = {
  DEBOUNCE_RESIZE: 150,
  DEBOUNCE_SCROLL: 100,
  BUTTON_COOLDOWN: 100,
  SNAP_DISABLE_DURATION: 50,
};

// Pixel tolerance for fractional pixel calculations
export const TOLERANCE = {
  EDGE_DETECTION: 1,
  ACTIVE_DETECTION: 2,
};

// CSS custom property names
export const CSS_VARS = {
  INDEX: '--carousel-index',
  TOTAL: '--carousel-total',
  PROGRESS: '--carousel-progress',
  AUTOPLAY_PROGRESS: '--carousel-autoplay-progress',
  AUTOPLAY_DURATION: '--carousel-autoplay-duration',
};

// Event names for CustomEvents
export const EVENTS = {
  CHANGE: 'change',
  SCROLL: 'scroll',
  REACH_START: 'reach-start',
  REACH_END: 'reach-end',
  AUTOPLAY_START: 'autoplay-start',
  AUTOPLAY_PAUSE: 'autoplay-pause',
};

// Data attribute names for configuration
export const ATTRIBUTES = {
  AUTOPLAY: 'data-carousel-autoplay',
  AUTOPLAY_DURATION: 'data-carousel-autoplay-duration',
  AUTOPLAY_PAUSE_HOVER: 'data-carousel-autoplay-pause-hover',
  AUTOPLAY_PAUSE_FOCUS: 'data-carousel-autoplay-pause-focus',
  SCROLL_BY: 'data-carousel-scroll-by',
};

export const CONFIG = {
  SELECTORS,
  CLASSES,
  DEFAULTS,
  TIMING,
  TOLERANCE,
  CSS_VARS,
  EVENTS,
  ATTRIBUTES,
};

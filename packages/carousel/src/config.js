// Builds a presence-based selector with opt-out support
const sel = (attr) => `[${attr}]:not([${attr}="false"])`;

export const SELECTOR_ATTRS = {
  // Structural
  CONTAINER:          'data-carousel-container',
  TRACK:              'data-carousel-track',
  ITEM:               'data-carousel-item',
  PREV_BTN:           'data-carousel-prev',
  NEXT_BTN:           'data-carousel-next',
  DOT:                'data-carousel-dot',
  PAGINATION_CURRENT: 'data-carousel-pagination-current',
  PAGINATION_TOTAL:   'data-carousel-pagination-total',
  PLAY_PAUSE_BTN:     'data-carousel-play-pause',
  RESTART_BTN:        'data-carousel-restart',
  // Boolean config
  KEYBOARD:              'data-carousel-keyboard',
  LOOP:                  'data-carousel-loop',
  AUTOPLAY:              'data-carousel-autoplay',
  AUTOPLAY_PAUSE_HOVER:  'data-carousel-autoplay-pause-hover',
  AUTOPLAY_PAUSE_FOCUS:  'data-carousel-autoplay-pause-focus',
};

export const SELECTORS = Object.fromEntries(
  Object.entries(SELECTOR_ATTRS).map(([k, v]) => [k, sel(v)])
);

// CSS classes applied to elements
export const CLASSES = {
  SCROLLING: 'carousel-scrolling', // Applied to track while scrolling is active
  DISABLED: 'carousel-button-disabled', // Applied to buttons when at start/end edges
  ACTIVE: 'carousel-item-active', // Applied to the current active item
  VISIBLE: 'carousel-item-visible', // Applied to items currently in viewport (reserved for future use)
  DOT_ACTIVE: 'carousel-dot-active', // Applied to the current active pagination dot
  LIVE_REGION: 'carousel-sr-only', // Applied to the live region for screen readers
  PLAYING: 'carousel-playing',
  AT_END: 'carousel-at-end',
  REDUCED_MOTION: 'carousel-reduced-motion',
};

export const DEFAULTS = {
  ALIGN: 'start',
  KEYBOARD: false,
  SCROLL_BY: 'item',
  LOOP: false,
  AUTOPLAY: false,
  AUTOPLAY_DURATION: 5000,
  AUTOPLAY_PAUSE_HOVER: false,
  AUTOPLAY_PAUSE_FOCUS: true,
};

// Timing constants in milliseconds
export const TIMING = {
  DEBOUNCE_RESIZE: 150,
  DEBOUNCE_SCROLL: 100,
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
  AUTOPLAY_STOP: 'autoplay-stop',
};

// Data attribute names for value-based configuration
export const ATTRIBUTES = {
  ALIGN: 'data-carousel-align',
  SCROLL_BY: 'data-carousel-scroll-by',
  AUTOPLAY_DURATION: 'data-carousel-autoplay-duration',
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

export const SELECTORS = {
  CONTAINER: '[data-carousel="container"]',
  TRACK: '[data-carousel="track"]',
  ITEM: '[data-carousel="item"]',
  PREV_BTN: '[data-carousel="prev"]',
  NEXT_BTN: '[data-carousel="next"]',
  PAGINATION: '[data-carousel="pagination"]',
  DOT: '[data-carousel="dot"]',
};

// CSS classes applied to elements
export const CLASSES = {
  SCROLLING: 'carousel-scrolling', // Applied to track while user or programmatic scroll is active
  DISABLED: 'carousel-button-disabled', // Applied to buttons when at start/end edges
  ACTIVE: 'carousel-item-active', // Applied to the current active item
  VISIBLE: 'carousel-item-visible', // Applied to items currently in viewport (reserved for future use)
  ANIMATING: 'carousel-animating', // Applied to track during programmatic scroll
  SNAP_DISABLED: 'carousel-snap-disabled', // Applied to track to temporarily disable scroll-snap during button navigation
  PAGINATION_ACTIVE: 'carousel-pagination-active', // Applied to the current active pagination dot
  PAGINATION_AUTO_DOT: 'carousel-auto-pagination-dot', // Applied to the automatically generated pagination dots
  LIVE_REGION: 'carousel-sr-only', // Applied to the live region for screen readers
};

export const DEFAULTS = {
  ALIGN: 'start',
  KEYBOARD: false,
  SCROLL_BY: 'item',
  LOOP: false,
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

export const CONFIG = {
  SELECTORS,
  CLASSES,
  DEFAULTS,
  TIMING,
  TOLERANCE,
};

// Pure utility functions for the carousel library

import { DEFAULTS } from './config.js';

// Counter for generating unique carousel IDs
let idCounter = 0;

// Generates a unique ID for each carousel instance
export function generateUniqueId() {
  idCounter += 1;
  return `carousel-${idCounter}`;
}

// Parses configuration from data attributes on the container element
export function parseConfig(container) {
  const align = container.getAttribute('data-carousel-align') || DEFAULTS.ALIGN;
  const keyboard = container.getAttribute('data-carousel-keyboard') === 'true';
  const scrollBy =
    container.getAttribute('data-carousel-scroll-by') || DEFAULTS.SCROLL_BY;
  const loop = container.getAttribute('data-carousel-loop') === 'true';

  return {
    align,
    keyboard,
    scrollBy,
    loop,
  };
}

// Creates a debounced version of a function
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Calculates the reference point for snap alignment detection
function calculateReferencePoint(
  scrollLeft,
  containerWidth,
  snapAlign,
  offsets = {}
) {
  const { startInset = 0, endInset = 0 } = offsets;
  switch (snapAlign) {
    case 'center':
      return scrollLeft + containerWidth / 2 + (startInset - endInset) / 2;
    case 'end':
      return scrollLeft + containerWidth - endInset;
    default: // 'start'
      return scrollLeft + startInset;
  }
}

// Gets the alignment point for a specific item based on snap alignment
function getItemAlignmentPoint(item, snapAlign) {
  const marginStart = item.marginStart || 0;
  const marginEnd = item.marginEnd || 0;
  switch (snapAlign) {
    case 'center':
      return item.center + (marginEnd - marginStart) / 2;
    case 'end':
      return item.right + marginEnd;
    default: // 'start'
      return item.left - marginStart;
  }
}

// Finds the index of the active item based on scroll position
export function findActiveIndex(
  itemPositions,
  scrollLeft,
  containerWidth,
  snapAlign,
  options = {}
) {
  const { startInset = 0, endInset = 0 } = options;
  const referencePoint = calculateReferencePoint(
    scrollLeft,
    containerWidth,
    snapAlign,
    { startInset, endInset }
  );

  let closestIndex = 0;
  let minDistance = Infinity;
  const distances = [];

  itemPositions.forEach((item, index) => {
    const itemPoint = getItemAlignmentPoint(item, snapAlign);
    const distance = Math.abs(itemPoint - referencePoint);

    distances.push({ index, itemPoint, distance });

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

// Returns the total number of slides for the provided collection of items
export function calculateTotalSlides(items) {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.length;
}

// Emits custom events both through the instance event system and as DOM events
export function emit(instance, event, data = {}) {
  const { events, container } = instance;

  // Call registered callbacks via instance.on()
  if (events.has(event)) {
    const callbacks = events.get(event);
    callbacks.forEach((callback) => {
      callback.call(instance, {
        type: event,
        target: instance,
        ...data,
      });
    });
  }

  // Dispatch native DOM custom event for addEventListener compatibility
  const customEvent = new CustomEvent(`carousel:${event}`, {
    detail: { carousel: instance, ...data },
    bubbles: true,
  });
  container.dispatchEvent(customEvent);
}

// Calculates and stores all dimensional measurements for the carousel
export function calculateDimensions(instance) {
  const { track, items, state, config } = instance;

  // Get computed styles to read CSS properties
  const trackStyle = getComputedStyle(track);

  const parseOffset = (value) => {
    if (!value || value === 'auto') {
      return { value: 0, specified: false };
    }
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) {
      return { value: 0, specified: false };
    }
    return { value: parsed, specified: true };
  };

  // Read gap from CSS (try both gap and column-gap for compatibility)
  const gap = parseFloat(trackStyle.gap || trackStyle.columnGap) || 0;

  const paddingInlineStart = parseOffset(
    trackStyle.paddingInlineStart || trackStyle.paddingLeft
  );
  const paddingInlineEnd = parseOffset(
    trackStyle.paddingInlineEnd || trackStyle.paddingRight
  );
  const scrollPaddingInlineStart = parseOffset(
    trackStyle.scrollPaddingInlineStart || trackStyle.scrollPaddingLeft
  );
  const scrollPaddingInlineEnd = parseOffset(
    trackStyle.scrollPaddingInlineEnd || trackStyle.scrollPaddingRight
  );

  const startInset = scrollPaddingInlineStart.specified
    ? scrollPaddingInlineStart.value
    : paddingInlineStart.value;
  const endInset = scrollPaddingInlineEnd.specified
    ? scrollPaddingInlineEnd.value
    : paddingInlineEnd.value;

  // Measure container and scroll dimensions
  const containerWidth = track.clientWidth;
  const scrollWidth = track.scrollWidth;

  // Calculate basic position data for active item detection
  const trackRect = track.getBoundingClientRect();
  const itemPositions = items.map((item, index) => {
    const rect = item.getBoundingClientRect();
    const itemStyle = getComputedStyle(item);

    // Read scroll-margin for detection calculations
    const marginStartValue = parseFloat(
      itemStyle.scrollMarginInlineStart || itemStyle.scrollMarginLeft
    );
    const marginEndValue = parseFloat(
      itemStyle.scrollMarginInlineEnd || itemStyle.scrollMarginRight
    );
    const marginStart = Number.isNaN(marginStartValue) ? 0 : marginStartValue;
    const marginEnd = Number.isNaN(marginEndValue) ? 0 : marginEndValue;

    // Calculate left position relative to track, accounting for current scroll
    const left = rect.left - trackRect.left + track.scrollLeft;
    const width = rect.width;

    return {
      index,
      left,
      width,
      center: left + width / 2,
      right: left + width,
      marginStart,
      marginEnd,
    };
  });

  // Update state with measurements needed for detection
  Object.assign(state, {
    gap,
    containerWidth,
    scrollWidth,
    itemPositions,
    startInset,
    endInset,
  });

  // Store snap alignment on instance for reference
  instance.snapAlign = config.align;
}

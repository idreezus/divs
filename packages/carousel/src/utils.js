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

  console.log('[DEBUG findActiveIndex]', {
    scrollLeft,
    containerWidth,
    snapAlign,
    referencePoint,
    startInset,
    endInset,
    distances,
    closestIndex,
    minDistance,
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

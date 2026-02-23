// Pure utility functions for the carousel library

import { DEFAULTS, CSS_VARS, SELECTORS, SELECTOR_ATTRS, ATTRIBUTES } from './config';
import type { CarouselConfig, CarouselInstance, ItemPosition, DebouncedFunction, FindActiveIndexOptions } from './types';

// Counter for generating unique carousel IDs
let idCounter = 0;

// Generates a unique ID for each carousel instance
export function generateUniqueId(): string {
  idCounter += 1;
  return `carousel-${idCounter}`;
}

// Parses configuration from data attributes on the container element
export function parseConfig(container: HTMLElement): CarouselConfig {
  const align = (container.getAttribute(ATTRIBUTES.ALIGN) || DEFAULTS.ALIGN) as CarouselConfig['align'];
  const keyboard = container.matches(SELECTORS.KEYBOARD);
  const loop = container.matches(SELECTORS.LOOP);
  const scrollBy = (container.getAttribute(ATTRIBUTES.SCROLL_BY) || DEFAULTS.SCROLL_BY) as CarouselConfig['scrollBy'];
  const autoplay = container.matches(SELECTORS.AUTOPLAY);
  const autoplayDuration = parseInt(container.getAttribute(ATTRIBUTES.AUTOPLAY_DURATION) as string, 10) || DEFAULTS.AUTOPLAY_DURATION;
  const autoplayPauseHover = container.matches(SELECTORS.AUTOPLAY_PAUSE_HOVER);
  const autoplayPauseFocus = container.getAttribute(SELECTOR_ATTRS.AUTOPLAY_PAUSE_FOCUS) !== 'false';

  return { align, keyboard, loop, scrollBy, autoplay, autoplayDuration, autoplayPauseHover, autoplayPauseFocus };
}

// Checks if the user prefers reduced motion
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Creates a debounced version of a function
export function debounce(func: (...args: unknown[]) => void, wait: number): DebouncedFunction {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

// Calculates the reference point for snap alignment detection
function calculateReferencePoint(
  scrollLeft: number,
  containerWidth: number,
  snapAlign: string,
  offsets: FindActiveIndexOptions = {}
): number {
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
function getItemAlignmentPoint(item: ItemPosition, snapAlign: string): number {
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
  itemPositions: ItemPosition[],
  scrollLeft: number,
  containerWidth: number,
  snapAlign: string,
  options: FindActiveIndexOptions = {}
): number {
  const { startInset = 0, endInset = 0 } = options;
  const referencePoint = calculateReferencePoint(
    scrollLeft,
    containerWidth,
    snapAlign,
    { startInset, endInset }
  );

  let closestIndex = 0;
  let minDistance = Infinity;

  itemPositions.forEach((item, index) => {
    const itemPoint = getItemAlignmentPoint(item, snapAlign);
    const distance = Math.abs(itemPoint - referencePoint);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

// Finds the target index when scrolling forward by one container width
export function findNextPageIndex(instance: CarouselInstance): number {
  const { track, state, config } = instance;
  const { itemPositions, containerWidth, maxReachableIndex } = state;
  const targetLeft = track!.scrollLeft + containerWidth;

  for (let i = state.currentIndex + 1; i < itemPositions.length; i++) {
    if (i > maxReachableIndex) return config.loop ? 0 : maxReachableIndex;
    if (itemPositions[i].left >= targetLeft) return i;
  }

  // Near the end
  return config.loop ? 0 : maxReachableIndex;
}

// Finds the target index when scrolling backward by one container width
export function findPrevPageIndex(instance: CarouselInstance): number {
  const { track, state, config } = instance;
  const { itemPositions, containerWidth, maxReachableIndex } = state;
  const targetLeft = track!.scrollLeft - containerWidth;

  for (let i = state.currentIndex - 1; i >= 0; i--) {
    if (itemPositions[i].left <= targetLeft) return i;
  }

  // Near the start
  return config.loop ? maxReachableIndex : 0;
}

// Emits a DOM CustomEvent on the carousel container
export function emit(instance: CarouselInstance, event: string, data: Record<string, unknown> = {}): void {
  const customEvent = new CustomEvent(`carousel:${event}`, {
    detail: { carousel: instance, ...data },
    bubbles: true,
  });
  instance.container.dispatchEvent(customEvent);
}

// Calculates and stores all dimensional measurements for the carousel
export function calculateDimensions(instance: CarouselInstance): void {
  const { track, items, state, config } = instance;

  // Get computed styles to read CSS properties
  const trackStyle = getComputedStyle(track!);

  const parseOffset = (value: string) => {
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
  const containerWidth = track!.clientWidth;
  const scrollWidth = track!.scrollWidth;

  // Calculate basic position data for active item detection
  const trackRect = track!.getBoundingClientRect();
  const itemPositions = items.map((item) => {
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
    const left = rect.left - trackRect.left + track!.scrollLeft;
    const width = rect.width;

    return {
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

  // Compute the highest index findActiveIndex can detect at max scroll
  const maxScroll = scrollWidth - containerWidth;
  let maxReachableIndex: number;
  if (maxScroll <= 0) {
    maxReachableIndex = 0;
  } else {
    maxReachableIndex = findActiveIndex(
      itemPositions, maxScroll, containerWidth, config.align,
      { startInset, endInset }
    );
  }

  const totalPositions = maxReachableIndex + 1;

  Object.assign(state, {
    maxReachableIndex,
    totalPositions,
  });
}

// Updates CSS custom properties on the carousel container
export function updateCSSProperties(instance: CarouselInstance): void {
  const { container, track, state } = instance;
  const { currentIndex, scrollWidth, containerWidth } = state;

  // Set one-based index for display friendliness
  container.style.setProperty(CSS_VARS.INDEX, String(currentIndex + 1));

  // Set total navigable positions (snap groups)
  container.style.setProperty(CSS_VARS.TOTAL, String(state.totalPositions));

  // Calculate progress (0-1) based on scroll position
  const maxScroll = scrollWidth - containerWidth;
  const scrollLeft = track!.scrollLeft;
  const progress =
    maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
  container.style.setProperty(CSS_VARS.PROGRESS, String(progress));
}

// Logs a console warning when loop/autoplay is enabled with unreachable items
export function warnUnreachableItems(instance: CarouselInstance): void {
  const { config, state, items, id } = instance;
  if (state.maxReachableIndex >= items.length - 1) return;
  if (!config.loop && !config.autoplay) return;

  const unreachableCount = items.length - 1 - state.maxReachableIndex;
  const features = [config.loop && 'loop', config.autoplay && 'autoplay'].filter((x): x is string => Boolean(x)).join(' and ');
  console.warn(
    `Carousel ${id}: ${unreachableCount} item(s) (indices ${state.maxReachableIndex + 1}-${items.length - 1}) ` +
    `share the same scroll position as item ${state.maxReachableIndex} and cannot be individually activated. ` +
    `${features} will cycle through ${state.totalPositions} positions instead of ${items.length}. ` +
    `To make every item individually reachable, use wider items or add padding-inline-end to the track.`
  );
}

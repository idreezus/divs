// Navigation and pagination functionality

import { CONFIG } from './config.js';
import {
  findActiveIndex,
  debounce,
  calculateTotalSlides,
  emit,
  calculateDimensions,
} from './utils.js';
import { updateActiveClasses } from './keyboard.js';

// Detects which item is currently active based on scroll position
export function detectActiveItem(instance) {
  const { track, state, snapAlign } = instance;
  const { itemPositions, currentIndex, startInset = 0, endInset = 0 } = state;

  // Find the active index using scroll position
  const scrollLeft = track.scrollLeft;
  const activeIndex = findActiveIndex(
    itemPositions,
    scrollLeft,
    state.containerWidth,
    snapAlign,
    {
      startInset,
      endInset,
    }
  );

  console.log('[DEBUG detectActiveItem]', {
    scrollLeft,
    currentIndex,
    activeIndex,
    changed: activeIndex !== currentIndex,
    startInset,
    endInset,
    itemPositions: itemPositions.map((p, i) => ({
      index: i,
      left: p.left,
      width: p.width,
    })),
  });

  // Only update if the active item has changed
  if (activeIndex !== currentIndex) {
    state.currentIndex = activeIndex;
    updateUI(instance);
    emit(instance, 'change', { index: activeIndex });
  }
}

// Updates the disabled state of navigation buttons based on scroll position
export function updateButtonStates(instance) {
  const { track, prevBtn, nextBtn, state } = instance;
  const { CLASSES, TOLERANCE } = CONFIG;

  const scrollLeft = track.scrollLeft;
  const { scrollWidth, containerWidth } = state;
  const maxScroll = scrollWidth - containerWidth;

  // Detect edges with tolerance for fractional pixels
  const atStart = scrollLeft <= TOLERANCE.EDGE_DETECTION;
  const atEnd = scrollLeft >= maxScroll - TOLERANCE.EDGE_DETECTION;

  console.log('[DEBUG updateButtonStates]', {
    scrollLeft,
    maxScroll,
    atStart,
    atEnd,
    currentIndex: state.currentIndex,
  });

  // Update prev button state
  if (prevBtn) {
    prevBtn.classList.toggle(CLASSES.DISABLED, atStart);
    prevBtn.disabled = atStart;

    // Emit reach-start event only once when reaching start
    if (atStart && !state.hasEmittedStart) {
      emit(instance, 'reach-start');
      state.hasEmittedStart = true;
    } else if (!atStart) {
      state.hasEmittedStart = false;
    }
  }

  // Update next button state
  if (nextBtn) {
    nextBtn.classList.toggle(CLASSES.DISABLED, atEnd);
    nextBtn.disabled = atEnd;

    // Emit reach-end event only once when reaching end
    if (atEnd && !state.hasEmittedEnd) {
      emit(instance, 'reach-end');
      state.hasEmittedEnd = true;
    } else if (!atEnd) {
      state.hasEmittedEnd = false;
    }
  }
}

// Handles scroll events on the track
export function handleScroll(instance) {
  const { track } = instance;
  const { CLASSES, TIMING } = CONFIG;

  // Add scrolling class immediately for instant feedback
  track.classList.add(CLASSES.SCROLLING);

  // Emit scroll event with current position
  emit(instance, 'scroll', { scrollLeft: track.scrollLeft });

  // Create debounced handler on first scroll (lazy initialization)
  if (!instance.debouncedScrollHandler) {
    instance.debouncedScrollHandler = debounce(() => {
      detectActiveItem(instance);
      updateButtonStates(instance);
      track.classList.remove(CLASSES.SCROLLING);
    }, TIMING.DEBOUNCE_SCROLL);
  }

  // Execute debounced handler
  instance.debouncedScrollHandler();
}

// Calculates the index of the next item for navigation
export function calculateNextIndex(instance) {
  const { state, items } = instance;
  const { currentIndex } = state;
  const nextIndex = Math.min(currentIndex + 1, items.length - 1);
  console.log('[DEBUG calculateNextIndex]', {
    currentIndex,
    nextIndex,
    itemsLength: items.length,
  });
  return nextIndex;
}

// Calculates the index of the previous item for navigation
export function calculatePrevIndex(instance) {
  const { state } = instance;
  const { currentIndex } = state;
  const prevIndex = Math.max(currentIndex - 1, 0);
  console.log('[DEBUG calculatePrevIndex]', {
    currentIndex,
    prevIndex,
  });
  return prevIndex;
}

// Scrolls to a specific item index with smooth animation
export function scrollToItem(instance, index) {
  const { track, items, state, snapAlign } = instance;
  const { CLASSES, TIMING } = CONFIG;

  console.log('[DEBUG scrollToItem] called with index:', index);

  const targetItem = items[index];
  if (!targetItem) {
    console.warn(`Carousel ${instance.id}: No item found at index ${index}`);
    return;
  }

  // Mark as animating to prevent concurrent navigation
  state.isAnimating = true;
  track.classList.add(CLASSES.ANIMATING);
  track.classList.add(CLASSES.SNAP_DISABLED);

  console.log('[DEBUG scrollToItem]', {
    index,
    snapAlign,
    currentScrollLeft: track.scrollLeft,
  });

  // Browser handles positioning with respect to scroll-padding and scroll-margin
  targetItem.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: snapAlign, // 'start', 'center', or 'end'
  });

  // Re-enable scroll-snap after short delay so native snap can take over
  setTimeout(() => {
    track.classList.remove(CLASSES.SNAP_DISABLED);
  }, TIMING.SNAP_DISABLE_DURATION);

  // Remove animating state after cooldown period
  setTimeout(() => {
    state.isAnimating = false;
    track.classList.remove(CLASSES.ANIMATING);
  }, TIMING.BUTTON_COOLDOWN);
}

// Handles next button click
export function handleNext(instance) {
  const { state } = instance;
  console.log('[DEBUG handleNext] called', {
    isAnimating: state.isAnimating,
    currentIndex: state.currentIndex,
  });
  if (state.isAnimating) return;

  const targetIndex = calculateNextIndex(instance);
  console.log('[DEBUG handleNext] scrolling to:', targetIndex);
  scrollToItem(instance, targetIndex);
}

// Handles previous button click
export function handlePrev(instance) {
  const { state, prevBtn } = instance;
  console.log('[DEBUG handlePrev] called', {
    isAnimating: state.isAnimating,
    currentIndex: state.currentIndex,
    buttonDisabled: prevBtn ? prevBtn.disabled : 'no button',
  });
  if (state.isAnimating) return;

  const targetIndex = calculatePrevIndex(instance);
  console.log('[DEBUG handlePrev] scrolling to:', targetIndex);
  scrollToItem(instance, targetIndex);
}

// Sets up ResizeObserver to handle responsive behavior
export function setupResizeObserver(instance) {
  const { container, track } = instance;
  const { TIMING } = CONFIG;

  // Create debounced resize handler
  const debouncedResize = debounce(() => {
    // Skip if container is hidden (offsetParent === null)
    if (container.offsetParent === null) return;

    // Recalculate everything and update UI
    calculateDimensions(instance);
    detectActiveItem(instance);
    updateButtonStates(instance);
  }, TIMING.DEBOUNCE_RESIZE);

  // Store debounced handler for cleanup
  instance.debouncedResizeHandler = debouncedResize;

  // Create ResizeObserver instance
  const resizeObserver = new ResizeObserver(() => {
    debouncedResize();
  });

  // Observe container and track only (not items for performance)
  resizeObserver.observe(container);
  resizeObserver.observe(track);

  // Store observer on instance for cleanup
  instance.resizeObserver = resizeObserver;
}

// Sets up pagination dots if pagination container exists
export function setupPagination(instance) {
  const { pagination, items, id } = instance;

  // Skip if no pagination container exists
  if (!pagination) return;

  // Remove previously bound handlers before rebuilding dots
  if (instance.boundDotHandlers) {
    instance.boundDotHandlers.forEach(({ dot, handler }) => {
      dot.removeEventListener('click', handler);
    });
  }

  const totalSlides = calculateTotalSlides(items);
  const existingDots = instance.dots ? [...instance.dots] : [];
  if (existingDots.length === 0) {
    console.warn(
      `Carousel ${id}: At least one pagination dot is required inside the pagination container.`
    );
    return;
  }
  const syncedDots = [];

  // Converts any provided dot into a semantic button so accessibility is consistent
  const normalizeDotElement = (dot) => {
    if (dot.tagName && dot.tagName.toLowerCase() === 'button') {
      return dot;
    }

    const button = document.createElement('button');

    [...dot.attributes].forEach((attribute) => {
      button.setAttribute(attribute.name, attribute.value);
    });

    while (dot.firstChild) {
      button.appendChild(dot.firstChild);
    }

    dot.replaceWith(button);
    return button;
  };

  // Applies required attributes and binds events
  const prepareDot = (dot, index) => {
    const { CLASSES } = CONFIG;

    dot.setAttribute('data-carousel', 'dot');
    dot.setAttribute('type', 'button');

    // Remove any pre-existing active class so scripted state controls visuals
    dot.classList.remove(CLASSES.PAGINATION_ACTIVE);

    const handler = () => instance.goTo(index);
    dot.addEventListener('click', handler);
    instance.boundDotHandlers.push({ dot, handler });
    syncedDots.push(dot);
  };

  // Initialize handler storage
  instance.boundDotHandlers = [];

  const normalizedDots = existingDots.map((dot) => normalizeDotElement(dot));
  const templateCount = normalizedDots.length;

  while (normalizedDots.length < totalSlides) {
    const templateDot = normalizedDots[normalizedDots.length % templateCount];
    const duplicate = templateDot.cloneNode(true);
    pagination.appendChild(duplicate);
    normalizedDots.push(duplicate);
  }

  if (normalizedDots.length > totalSlides) {
    const removedDots = normalizedDots.splice(totalSlides);
    removedDots.forEach((dot) => {
      dot.remove();
    });
  }

  normalizedDots.forEach((dot, index) => {
    prepareDot(dot, index);
  });

  // Update dots reference on instance
  instance.dots = syncedDots;

  // Set initial active state
  updatePagination(instance);
}

// Updates pagination dots to reflect current active item
export function updatePagination(instance) {
  const { dots, state } = instance;
  const { CLASSES } = CONFIG;
  const { currentIndex } = state;

  // Skip if no dots exist
  if (!dots || dots.length === 0) return;

  // Update each dot's active state
  dots.forEach((dot, index) => {
    const isActive = index === currentIndex;
    dot.classList.toggle(CLASSES.PAGINATION_ACTIVE, isActive);
  });
}

// Batches DOM updates using requestAnimationFrame for better performance
export function updateUI(instance) {
  const { rafPending } = instance;

  // Avoid scheduling multiple RAF callbacks
  if (rafPending) return;

  instance.rafPending = true;
  requestAnimationFrame(() => {
    updateActiveClasses(instance);
    updateButtonStates(instance);
    updatePagination(instance);
    instance.rafPending = false;
  });
}

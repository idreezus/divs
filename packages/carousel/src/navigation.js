// Navigation and pagination functionality

import { CONFIG } from './config.js';
import {
  findActiveIndex,
  findNextPageIndex,
  findPrevPageIndex,
  debounce,
  calculateTotalSlides,
  emit,
  calculateDimensions,
  updateCSSProperties,
} from './utils.js';
import { updateActiveClasses } from './keyboard.js';
import { pauseAutoplay } from './autoplay.js';

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

  // Only update if the active item has changed
  if (activeIndex !== currentIndex) {
    state.currentIndex = activeIndex;
    updateUI(instance);
    emit(instance, 'change', { index: activeIndex });
  }
}

// Updates the disabled state of navigation buttons based on current index
export function updateButtonStates(instance) {
  const { track, prevBtn, nextBtn, state, config } = instance;
  const { CLASSES, TOLERANCE } = CONFIG;

  // Edge detection still uses physical scroll position (for reach-start/reach-end events)
  const scrollLeft = track.scrollLeft;
  const maxScroll = state.scrollWidth - state.containerWidth;
  const atStart = scrollLeft <= TOLERANCE.EDGE_DETECTION;
  const atEnd = scrollLeft >= maxScroll - TOLERANCE.EDGE_DETECTION;

  // Button disabled state uses index (not scroll position)
  const atFirstPosition = state.currentIndex <= 0;
  const atLastPosition = state.currentIndex >= state.maxReachableIndex;

  if (config.loop) {
    if (prevBtn) { prevBtn.classList.remove(CLASSES.DISABLED); prevBtn.disabled = false; }
    if (nextBtn) { nextBtn.classList.remove(CLASSES.DISABLED); nextBtn.disabled = false; }
  } else {
    if (prevBtn) {
      prevBtn.classList.toggle(CLASSES.DISABLED, atFirstPosition);
      prevBtn.disabled = atFirstPosition;
    }
    if (nextBtn) {
      nextBtn.classList.toggle(CLASSES.DISABLED, atLastPosition);
      nextBtn.disabled = atLastPosition;
    }
  }

  // Edge events still fire based on physical scroll position
  if (atStart && !state.hasEmittedStart) {
    emit(instance, 'reach-start');
    state.hasEmittedStart = true;
  } else if (!atStart) {
    state.hasEmittedStart = false;
  }

  if (atEnd && !state.hasEmittedEnd) {
    emit(instance, 'reach-end');
    state.hasEmittedEnd = true;
  } else if (!atEnd) {
    state.hasEmittedEnd = false;
  }
}

// Handles scroll events on the track
export function handleScroll(instance) {
  const { track } = instance;
  const { CLASSES, TIMING } = CONFIG;

  // User scroll while autoplay is running → sticky pause
  if (!instance.state.isProgrammaticScroll && instance.state.isAutoplaying && !instance.state.isPaused) {
    pauseAutoplay(instance, 'user');
  }

  track.classList.add(CLASSES.SCROLLING);
  emit(instance, 'scroll', { scrollLeft: track.scrollLeft });

  // Only run debounced detection for user-initiated scrolls.
  // For programmatic scrolls, currentIndex is already set by the caller.
  if (!instance.state.isProgrammaticScroll) {
    if (!instance.debouncedScrollHandler) {
      instance.debouncedScrollHandler = debounce(() => {
        detectActiveItem(instance);
        updateButtonStates(instance);
        track.classList.remove(CLASSES.SCROLLING);
      }, TIMING.DEBOUNCE_SCROLL);
    }
    instance.debouncedScrollHandler();
  }
}

// Calculates the index of the next item for navigation
export function calculateNextIndex(instance) {
  const { state, config } = instance;

  if (config.scrollBy === 'page') return findNextPageIndex(instance);

  const nextIndex = state.currentIndex + 1;
  if (nextIndex > state.maxReachableIndex) {
    return config.loop ? 0 : state.maxReachableIndex;
  }
  return nextIndex;
}

// Calculates the index of the previous item for navigation
export function calculatePrevIndex(instance) {
  const { state, config } = instance;

  if (config.scrollBy === 'page') return findPrevPageIndex(instance);

  const prevIndex = state.currentIndex - 1;
  if (prevIndex < 0) {
    return config.loop ? state.maxReachableIndex : 0;
  }
  return prevIndex;
}

// Scrolls to a specific item index with smooth animation
export function scrollToItem(instance, index) {
  const { track, items, state, snapAlign } = instance;
  const { CLASSES, TIMING } = CONFIG;

  const targetItem = items[index];
  if (!targetItem) {
    console.warn(`Carousel ${instance.id}: No item found at index ${index}`);
    return;
  }

  // Cancel any pending scroll cleanup from a previous scrollToItem call
  if (instance._scrollCleanup) {
    instance._scrollCleanup();
  }

  state.isProgrammaticScroll = true;
  track.classList.add(CLASSES.ANIMATING);
  track.classList.add(CLASSES.SNAP_DISABLED);

  // Re-enable scroll-snap after short delay
  setTimeout(() => {
    track.classList.remove(CLASSES.SNAP_DISABLED);
  }, TIMING.SNAP_DISABLE_DURATION);

  // One-shot scrollend listener to clear programmatic scroll flag
  const onScrollEnd = () => {
    clearTimeout(fallbackTimer);
    state.isProgrammaticScroll = false;
    track.classList.remove(CLASSES.ANIMATING);
    track.classList.remove(CLASSES.SCROLLING);
    instance._scrollCleanup = null;
  };
  track.addEventListener('scrollend', onScrollEnd, { once: true });

  // Fallback timeout: if scrollIntoView produces no scroll (item already in view),
  // scrollend won't fire. Clear the flag after a generous timeout.
  const fallbackTimer = setTimeout(() => {
    track.removeEventListener('scrollend', onScrollEnd);
    state.isProgrammaticScroll = false;
    track.classList.remove(CLASSES.ANIMATING);
    track.classList.remove(CLASSES.SCROLLING);
    instance._scrollCleanup = null;
  }, TIMING.SCROLL_END_FALLBACK);

  // Store cleanup function so a subsequent scrollToItem can cancel this one
  instance._scrollCleanup = () => {
    track.removeEventListener('scrollend', onScrollEnd);
    clearTimeout(fallbackTimer);
    state.isProgrammaticScroll = false;
    track.classList.remove(CLASSES.ANIMATING);
    instance._scrollCleanup = null;
  };

  targetItem.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: snapAlign,
  });
}

// Handles next button click
export function handleNext(instance) {
  const { state } = instance;
  if (state.isProgrammaticScroll) return;

  const targetIndex = calculateNextIndex(instance);
  if (targetIndex === state.currentIndex) return;

  // Set index directly (decoupled from scroll detection)
  state.currentIndex = targetIndex;
  updateUI(instance);
  emit(instance, 'change', { index: targetIndex });

  // Scroll as visual effect
  scrollToItem(instance, targetIndex);
}

// Handles previous button click
export function handlePrev(instance) {
  const { state } = instance;
  if (state.isProgrammaticScroll) return;

  const targetIndex = calculatePrevIndex(instance);
  if (targetIndex === state.currentIndex) return;

  state.currentIndex = targetIndex;
  updateUI(instance);
  emit(instance, 'change', { index: targetIndex });

  scrollToItem(instance, targetIndex);
}

// Sets up ResizeObserver to handle responsive behavior
export function setupResizeObserver(instance) {
  const { container, track } = instance;
  const { TIMING } = CONFIG;

  const debouncedResize = debounce(() => {
    if (container.offsetParent === null) return;

    const prevTotalPositions = instance.state.totalPositions;

    calculateDimensions(instance);

    // If the number of snap positions changed, re-setup pagination
    if (instance.state.totalPositions !== prevTotalPositions) {
      setupPagination(instance);
    }

    // Clamp currentIndex to new maxReachableIndex
    if (instance.state.currentIndex > instance.state.maxReachableIndex) {
      instance.state.currentIndex = instance.state.maxReachableIndex;
    }

    detectActiveItem(instance);
    updateButtonStates(instance);
  }, TIMING.DEBOUNCE_RESIZE);

  instance.debouncedResizeHandler = debouncedResize;

  const resizeObserver = new ResizeObserver(() => {
    debouncedResize();
  });

  resizeObserver.observe(container);
  resizeObserver.observe(track);
  instance.resizeObserver = resizeObserver;
}

// Sets up pagination dots if any exist in the container
export function setupPagination(instance) {
  const { dots: existingDots, container, items, id } = instance;
  const { CLASSES } = CONFIG;

  // Skip if no dots exist
  if (!existingDots || existingDots.length === 0) return;

  // Remove previously bound handlers before rebuilding dots
  if (instance.boundDotHandlers) {
    instance.boundDotHandlers.forEach(({ dot, handler }) => {
      dot.removeEventListener('click', handler);
    });
  }

  // Initialize handler storage
  instance.boundDotHandlers = [];

  const totalSlides = calculateTotalSlides(instance);

  // Converts any provided dot into a semantic button for accessibility
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

  // Use first dot as template
  const templateDot = normalizeDotElement(existingDots[0]);
  const allDots = [templateDot];

  // Normalize remaining existing dots
  for (let i = 1; i < existingDots.length; i++) {
    allDots.push(normalizeDotElement(existingDots[i]));
  }

  // Get parent from first dot for appending clones
  const dotsParent = templateDot.parentElement;

  // Clone template to match total slides
  while (allDots.length < totalSlides) {
    const duplicate = templateDot.cloneNode(true);
    dotsParent.appendChild(duplicate);
    allDots.push(duplicate);
  }

  // Remove excess dots
  while (allDots.length > totalSlides) {
    const removed = allDots.pop();
    removed.remove();
  }

  // Prepare each dot with attributes, aria-label, and click handler
  const preparedDots = [];
  allDots.forEach((dot, index) => {
    dot.setAttribute('type', 'button');

    // Remove any pre-existing active class so scripted state controls visuals
    dot.classList.remove(CLASSES.DOT_ACTIVE);

    // Add accessible label
    dot.setAttribute(
      'aria-label',
      `Go to slide ${index + 1} of ${totalSlides}`
    );

    // Bind click handler with autoplay pause
    const handler = () => {
      if (instance.state.isAutoplaying && !instance.state.isPaused) {
        pauseAutoplay(instance, 'user');
      }
      instance.goTo(index);
    };
    dot.addEventListener('click', handler);
    instance.boundDotHandlers.push({ dot, handler });
    preparedDots.push(dot);
  });

  // Update dots reference on instance
  instance.dots = preparedDots;

  // Set initial active state
  updatePagination(instance);
}

// Updates pagination dots to reflect current active item
export function updatePagination(instance) {
  const { dots, container, state } = instance;
  const { CLASSES, SELECTORS } = CONFIG;
  const { currentIndex } = state;

  if (dots && dots.length > 0) {
    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle(CLASSES.DOT_ACTIVE, isActive);

      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  const currentEl = container.querySelector(SELECTORS.PAGINATION_CURRENT);
  if (currentEl) {
    currentEl.textContent = currentIndex + 1;
  }

  const totalEl = container.querySelector(SELECTORS.PAGINATION_TOTAL);
  if (totalEl) {
    totalEl.textContent = state.totalPositions;
  }
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
    updateCSSProperties(instance);
    instance.rafPending = false;
  });
}

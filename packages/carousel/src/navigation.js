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

// Updates the disabled state of navigation buttons based on scroll position
export function updateButtonStates(instance) {
  const { track, prevBtn, nextBtn, state, config } = instance;
  const { CLASSES, TOLERANCE } = CONFIG;

  const scrollLeft = track.scrollLeft;
  const { scrollWidth, containerWidth } = state;
  const maxScroll = scrollWidth - containerWidth;

  // Detect edges with tolerance for fractional pixels
  const atStart = scrollLeft <= TOLERANCE.EDGE_DETECTION;
  const atEnd = scrollLeft >= maxScroll - TOLERANCE.EDGE_DETECTION;

  if (config.loop) {
    // Never disable buttons when looping
    if (prevBtn) {
      prevBtn.classList.remove(CLASSES.DISABLED);
      prevBtn.disabled = false;
    }
    if (nextBtn) {
      nextBtn.classList.remove(CLASSES.DISABLED);
      nextBtn.disabled = false;
    }
  } else {
    // Update prev button state
    if (prevBtn) {
      prevBtn.classList.toggle(CLASSES.DISABLED, atStart);
      prevBtn.disabled = atStart;
    }

    // Update next button state
    if (nextBtn) {
      nextBtn.classList.toggle(CLASSES.DISABLED, atEnd);
      nextBtn.disabled = atEnd;
    }
  }

  // Edge events fire regardless of loop mode (physical scroll position)
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

  // Detect user-initiated scroll (not programmatic) and pause autoplay
  if (!instance.state.isAnimating && instance.state.isAutoplaying && !instance.state.isPaused) {
    pauseAutoplay(instance, 'user');
  }

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
  const { state, items, config } = instance;

  if (config.scrollBy === 'page') return findNextPageIndex(instance);

  const nextIndex = state.currentIndex + 1;
  if (nextIndex > items.length - 1) {
    return config.loop ? 0 : items.length - 1;
  }
  return nextIndex;
}

// Calculates the index of the previous item for navigation
export function calculatePrevIndex(instance) {
  const { state, items, config } = instance;

  if (config.scrollBy === 'page') return findPrevPageIndex(instance);

  const prevIndex = state.currentIndex - 1;
  if (prevIndex < 0) {
    return config.loop ? items.length - 1 : 0;
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

  // Mark as animating to prevent concurrent navigation
  state.isAnimating = true;
  track.classList.add(CLASSES.ANIMATING);
  track.classList.add(CLASSES.SNAP_DISABLED);

  // Browser handles positioning with respect to scroll-padding and scroll-margin
  targetItem.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    container: 'nearest',
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
  if (state.isAnimating) return;

  const targetIndex = calculateNextIndex(instance);
  scrollToItem(instance, targetIndex);
}

// Handles previous button click
export function handlePrev(instance) {
  const { state } = instance;
  if (state.isAnimating) return;

  const targetIndex = calculatePrevIndex(instance);
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

  const totalSlides = calculateTotalSlides(items);

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
  const { dots, container, items, state } = instance;
  const { CLASSES, SELECTORS } = CONFIG;
  const { currentIndex } = state;

  // Update each dot's active state and aria-current
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

  // Inject text content for pagination display elements (silent skip if not found)
  const currentEl = container.querySelector(SELECTORS.PAGINATION_CURRENT);
  if (currentEl) {
    currentEl.textContent = currentIndex + 1;
  }

  const totalEl = container.querySelector(SELECTORS.PAGINATION_TOTAL);
  if (totalEl) {
    totalEl.textContent = items.length;
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

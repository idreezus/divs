// Navigation and marker functionality

import { CONFIG } from './config.js';
import {
  findActiveIndex,
  findNextPageIndex,
  findPrevPageIndex,
  debounce,
  calculateTotalPositions,
  emit,
  calculateDimensions,
  updateCSSProperties,
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

  // Only update if the active item has changed
  if (activeIndex !== currentIndex) {
    state.currentIndex = activeIndex;
    updateUI(instance);
    emit(instance, 'snapchange', { index: activeIndex });
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

  // Toggle at-end class for autoplay-configured carousels
  if (instance.autoplay && !config.loop) {
    instance.container.classList.toggle(CLASSES.AT_END, atLastPosition && !state.isAutoplaying);
  } else {
    instance.container.classList.remove(CLASSES.AT_END);
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

  track.classList.add(CLASSES.SCROLLING);
  emit(instance, 'scroll', { scrollLeft: track.scrollLeft });

  if (!instance.debouncedScrollHandler) {
    instance.debouncedScrollHandler = debounce(() => {
      detectActiveItem(instance);
      updateButtonStates(instance);
      track.classList.remove(CLASSES.SCROLLING);
    }, TIMING.DEBOUNCE_SCROLL);
  }
  instance.debouncedScrollHandler();
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
  const { items, snapAlign } = instance;
  const targetItem = items[index];
  if (!targetItem) {
    console.warn(`Carousel ${instance.id}: No item found at index ${index}`);
    return;
  }

  targetItem.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: snapAlign,
  });
}

// Handles next button click
export function handleNext(instance) {
  const { state } = instance;

  const targetIndex = calculateNextIndex(instance);
  if (targetIndex === state.currentIndex) return;

  // Set index directly (decoupled from scroll detection)
  state.currentIndex = targetIndex;
  updateUI(instance);
  emit(instance, 'snapchange', { index: targetIndex });

  // Scroll as visual effect
  scrollToItem(instance, targetIndex);
}

// Handles previous button click
export function handlePrev(instance) {
  const { state } = instance;

  const targetIndex = calculatePrevIndex(instance);
  if (targetIndex === state.currentIndex) return;

  state.currentIndex = targetIndex;
  updateUI(instance);
  emit(instance, 'snapchange', { index: targetIndex });

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

    // If the number of snap positions changed, re-setup markers
    if (instance.state.totalPositions !== prevTotalPositions) {
      setupMarkers(instance);
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

// Sets up markers if any exist in the container
export function setupMarkers(instance) {
  const { markers: existingMarkers, container, items, id } = instance;
  const { CLASSES } = CONFIG;

  // Skip if no markers exist
  if (!existingMarkers || existingMarkers.length === 0) return;

  // Remove previously bound handlers before rebuilding markers
  if (instance.boundMarkerHandlers) {
    instance.boundMarkerHandlers.forEach(({ marker, handler }) => {
      marker.removeEventListener('click', handler);
    });
  }

  // Initialize handler storage
  instance.boundMarkerHandlers = [];

  const totalPositions = calculateTotalPositions(instance);

  // Converts any provided marker into a semantic button for accessibility
  const normalizeMarkerElement = (marker) => {
    if (marker.tagName && marker.tagName.toLowerCase() === 'button') {
      return marker;
    }

    const button = document.createElement('button');

    [...marker.attributes].forEach((attribute) => {
      button.setAttribute(attribute.name, attribute.value);
    });

    while (marker.firstChild) {
      button.appendChild(marker.firstChild);
    }

    marker.replaceWith(button);
    return button;
  };

  // Use first marker as template
  const templateMarker = normalizeMarkerElement(existingMarkers[0]);
  const allMarkers = [templateMarker];

  // Normalize remaining existing markers
  for (let i = 1; i < existingMarkers.length; i++) {
    allMarkers.push(normalizeMarkerElement(existingMarkers[i]));
  }

  // Get parent from first marker for appending clones
  const markerGroup = templateMarker.parentElement;
  instance.markerGroup = markerGroup;

  // Set semantic roles on marker group (only if not already set by author)
  if (!markerGroup.hasAttribute('role')) {
    markerGroup.setAttribute('role', 'tablist');
  }

  // Clone template to match total positions
  while (allMarkers.length < totalPositions) {
    const duplicate = templateMarker.cloneNode(true);
    markerGroup.appendChild(duplicate);
    allMarkers.push(duplicate);
  }

  // Remove excess markers
  while (allMarkers.length > totalPositions) {
    const removed = allMarkers.pop();
    removed.remove();
  }

  // Prepare each marker with attributes, aria-label, and click handler
  const preparedMarkers = [];
  allMarkers.forEach((marker, index) => {
    marker.setAttribute('type', 'button');

    // Set semantic role on marker (only if not already set by author)
    if (!marker.hasAttribute('role')) {
      marker.setAttribute('role', 'tab');
    }

    // Remove any pre-existing active class so scripted state controls visuals
    marker.classList.remove(CLASSES.MARKER_ACTIVE);

    // Add accessible label
    marker.setAttribute(
      'aria-label',
      `Scroll to item ${index + 1} of ${totalPositions}`
    );

    // Bind click handler (goTo handles autoplay stop)
    const handler = () => {
      instance.goTo(index);
    };
    marker.addEventListener('click', handler);
    instance.boundMarkerHandlers.push({ marker, handler });
    preparedMarkers.push(marker);
  });

  // Update markers reference on instance
  instance.markers = preparedMarkers;

  // Set up roving tabindex keyboard handler on marker group
  setupMarkerKeyboard(instance);

  // Set initial active state
  updateMarkers(instance);
}

// Sets up delegated keyboard handler on marker group for roving tabindex
function setupMarkerKeyboard(instance) {
  const { markers, markerGroup, config } = instance;
  if (!markers || markers.length <= 1) return;

  // Remove existing handler if present (idempotent for rebuilds)
  if (instance.boundHandlers.markerKeydown && markerGroup) {
    markerGroup.removeEventListener('keydown', instance.boundHandlers.markerKeydown);
  }

  const handler = (event) => {
    const currentMarkerIndex = instance.markers.indexOf(event.target);
    if (currentMarkerIndex === -1) return;

    const lastIndex = instance.markers.length - 1;
    let targetIndex = null;

    switch (event.key) {
      case 'ArrowRight':
        targetIndex = currentMarkerIndex < lastIndex
          ? currentMarkerIndex + 1
          : (config.loop ? 0 : lastIndex);
        break;
      case 'ArrowLeft':
        targetIndex = currentMarkerIndex > 0
          ? currentMarkerIndex - 1
          : (config.loop ? lastIndex : 0);
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (targetIndex !== currentMarkerIndex) {
      instance.goTo(targetIndex);
      instance.markers[targetIndex].focus();
    }
  };

  markerGroup.addEventListener('keydown', handler);
  instance.boundHandlers.markerKeydown = handler;
}

// Updates markers to reflect current active item
export function updateMarkers(instance) {
  const { markers, container, state } = instance;
  const { CLASSES, SELECTORS } = CONFIG;
  const { currentIndex } = state;

  if (markers && markers.length > 0) {
    markers.forEach((marker, index) => {
      const isActive = index === currentIndex;
      marker.classList.toggle(CLASSES.MARKER_ACTIVE, isActive);
      marker.setAttribute('tabindex', isActive ? '0' : '-1');

      marker.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Move focus to active marker only when user is already interacting with markers
    if (instance.markerGroup?.contains(document.activeElement)) {
      markers[currentIndex].focus();
    }
  }

  const currentEl = container.querySelector(SELECTORS.COUNTER_CURRENT);
  if (currentEl) {
    currentEl.textContent = currentIndex + 1;
  }

  const totalEl = container.querySelector(SELECTORS.COUNTER_TOTAL);
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
    updateMarkers(instance);
    updateCSSProperties(instance);
    if (instance.liveRegion) {
      instance.liveRegion.textContent = `Item ${instance.state.currentIndex + 1} of ${instance.state.totalPositions}`;
    }
    instance.rafPending = false;
  });
}

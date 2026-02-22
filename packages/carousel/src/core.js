// Main Carousel class and core functionality

import { CONFIG } from './config.js';
import {
  generateUniqueId,
  parseConfig,
  prefersReducedMotion,
  emit,
  calculateDimensions,
  updateCSSProperties,
  warnUnreachableItems,
} from './utils.js';
import {
  detectActiveItem,
  handleScroll,
  scrollToItem,
  handleNext,
  handlePrev,
  setupResizeObserver,
  setupMarkers,
  updateUI,
} from './navigation.js';
import { setupKeyboardNavigation } from './keyboard.js';
import {
  setupAutoplay,
  startAutoplay,
  stopAutoplay,
  cleanupAutoplay,
} from './autoplay.js';

// Finds and validates all required and optional elements within the carousel container
function findElements(instance) {
  const { container, id } = instance;
  const { SELECTORS } = CONFIG;

  // Find required track element (legacy backwards compat)
  const track = container.querySelector(`${SELECTORS.TRACK}, [data-carousel="track"]`);
  if (!track) {
    console.warn(
      `Carousel ${id}: Track element not found. Expected element with data-carousel-track.`
    );
    return false;
  }

  // Find required item elements (legacy backwards compat)
  const items = [...container.querySelectorAll(`${SELECTORS.ITEM}, [data-carousel="item"]`)];
  if (items.length === 0) {
    console.warn(
      `Carousel ${id}: No items found. Expected at least one element with data-carousel-item.`
    );
    return false;
  }

  // Find optional navigation buttons (legacy backwards compat)
  const prevBtn = container.querySelector(`${SELECTORS.PREV_BTN}, [data-carousel="prev"]`);
  const nextBtn = container.querySelector(`${SELECTORS.NEXT_BTN}, [data-carousel="next"]`);

  // Find optional markers (can be anywhere in container)
  const markers = [...container.querySelectorAll(SELECTORS.MARKER)];

  // Find autoplay-specific elements only when autoplay is configured
  let playPauseBtn = null;
  let restartBtn = null;

  if (instance.config.autoplay) {
    playPauseBtn = container.querySelector(SELECTORS.PLAY_PAUSE_BTN);
    restartBtn = container.querySelector(SELECTORS.RESTART_BTN);
  } else {
    if (container.querySelector(SELECTORS.PLAY_PAUSE_BTN)) {
      console.warn(
        `Carousel ${id}: Play/pause button found but autoplay is not enabled. Add data-carousel-autoplay to the container.`
      );
    }
    if (container.querySelector(SELECTORS.RESTART_BTN)) {
      console.warn(
        `Carousel ${id}: Restart button found but autoplay is not enabled. Add data-carousel-autoplay to the container.`
      );
    }
  }

  // Add data-carousel-id for easier debugging in devtools
  container.setAttribute('data-carousel-id', id);

  // Store all element references on the instance
  Object.assign(instance, {
    track,
    items,
    prevBtn,
    nextBtn,
    markers,
    playPauseBtn,
    restartBtn,
  });

  return true;
}

// Attaches event listeners for user interactions
function attachEventListeners(instance) {
  const { track, prevBtn, nextBtn } = instance;

  // Create bound handlers and store them for later removal
  instance.boundHandlers = {
    scroll: () => {
      handleScroll(instance);
    },
    prev: () => instance.prev(),
    next: () => instance.next(),
  };

  // Attach scroll listener with passive flag for better performance
  track.addEventListener('scroll', instance.boundHandlers.scroll, {
    passive: true,
  });

  // Attach button listeners if buttons exist
  if (prevBtn) {
    prevBtn.addEventListener('click', instance.boundHandlers.prev);
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', instance.boundHandlers.next);
  }

  // Autoplay-specific listeners (only when autoplay is configured)
  if (instance.config.autoplay) {
    // Stop autoplay on direct user interaction with the track
    instance.boundHandlers.trackPointerDown = () => {
      if (instance.state.isAutoplaying) stopAutoplay(instance, 'user');
    };
    instance.boundHandlers.trackWheel = () => {
      if (instance.state.isAutoplaying) stopAutoplay(instance, 'user');
    };
    track.addEventListener('pointerdown', instance.boundHandlers.trackPointerDown);
    track.addEventListener('wheel', instance.boundHandlers.trackWheel, { passive: true });

    if (instance.playPauseBtn) {
      instance.boundHandlers.playPause = () => {
        if (instance.state.isAutoplaying) {
          stopAutoplay(instance, 'user');
        } else {
          instance.play();
        }
      };
      instance.playPauseBtn.addEventListener('click', instance.boundHandlers.playPause);
    }

    if (instance.restartBtn) {
      instance.boundHandlers.restart = () => {
        instance.goTo(0);
        instance.play();
      };
      instance.restartBtn.addEventListener('click', instance.boundHandlers.restart);
    }
  }
}

// Cleans up all event listeners, observers, and references
function cleanup(instance) {
  const { prevBtn, nextBtn, track, container } = instance;

  // Clean up autoplay before removing other listeners
  cleanupAutoplay(instance);

  if (instance.playPauseBtn && instance.boundHandlers?.playPause) {
    instance.playPauseBtn.removeEventListener('click', instance.boundHandlers.playPause);
  }

  if (instance.restartBtn && instance.boundHandlers?.restart) {
    instance.restartBtn.removeEventListener('click', instance.boundHandlers.restart);
  }

  // Remove event listeners using stored bound handlers
  if (instance.boundHandlers) {
    track.removeEventListener('scroll', instance.boundHandlers.scroll);

    if (instance.boundHandlers.trackPointerDown) {
      track.removeEventListener('pointerdown', instance.boundHandlers.trackPointerDown);
    }
    if (instance.boundHandlers.trackWheel) {
      track.removeEventListener('wheel', instance.boundHandlers.trackWheel);
    }

    if (prevBtn) {
      prevBtn.removeEventListener('click', instance.boundHandlers.prev);
    }
    if (nextBtn) {
      nextBtn.removeEventListener('click', instance.boundHandlers.next);
    }

    // Remove keyboard listener if it exists
    if (instance.boundHandlers.keyboard) {
      container.removeEventListener('keydown', instance.boundHandlers.keyboard);
    }

    // Remove marker keyboard listener if it exists
    if (instance.boundHandlers.markerKeydown && instance.markerGroup) {
      instance.markerGroup.removeEventListener('keydown', instance.boundHandlers.markerKeydown);
    }
  }

  // Remove marker event listeners
  if (instance.boundMarkerHandlers) {
    instance.boundMarkerHandlers.forEach(({ marker, handler }) => {
      marker.removeEventListener('click', handler);
    });
  }

  // Remove live region element
  instance.liveRegion?.remove();

  // Disconnect ResizeObserver
  if (instance.resizeObserver) {
    instance.resizeObserver.disconnect();
    instance.resizeObserver = null;
  }

  // Clear all instance properties to help garbage collection
  Object.keys(instance).forEach((key) => {
    instance[key] = null;
  });
}

// Initializes the carousel instance
function init(instance) {
  const { container, config } = instance;
  const { CLASSES, CSS_VARS } = CONFIG;

  // Find and validate elements first
  const elementsFound = findElements(instance);
  if (!elementsFound) {
    return false;
  }

  // Set semantic roles on track and items (only if not already set by author)
  if (!instance.track.hasAttribute('role')) {
    instance.track.setAttribute('role', 'list');
  }
  instance.items.forEach((item) => {
    if (!item.hasAttribute('role')) {
      item.setAttribute('role', 'listitem');
    }
  });

  // Add accessible label to restart button
  if (instance.restartBtn && !instance.restartBtn.hasAttribute('aria-label')) {
    instance.restartBtn.setAttribute('aria-label', 'Restart autoplay');
  }

  // Calculate initial dimensions
  calculateDimensions(instance);

  // Warn if loop/autoplay enabled with unreachable items
  warnUnreachableItems(instance);

  // Set initial CSS custom properties before first paint
  updateCSSProperties(instance);

  // Create live region for screen reader announcements
  const liveRegion = document.createElement('div');
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  container.appendChild(liveRegion);
  instance.liveRegion = liveRegion;

  // Attach event listeners
  attachEventListeners(instance);

  // Set up responsive behavior
  setupResizeObserver(instance);

  // Set up markers if they exist
  setupMarkers(instance);

  // Set up keyboard navigation if enabled
  if (config.keyboard) {
    setupKeyboardNavigation(instance);
  }

  // Set up autoplay if enabled and reduced motion is not preferred
  if (prefersReducedMotion()) {
    container.classList.add(CLASSES.REDUCED_MOTION);
  }
  if (config.autoplay && !prefersReducedMotion()) {
    container.style.setProperty(CSS_VARS.AUTOPLAY_DURATION, config.autoplayDuration + 'ms');
    setupAutoplay(instance, handleNext);
    instance.autoplay.onStop = () => updateUI(instance);
    startAutoplay(instance);
  }

  // Set initial UI state
  updateUI(instance);

  return true;
}

// Main Carousel class
export class Carousel {
  constructor(container) {
    const id = generateUniqueId();
    const config = parseConfig(container);

    // Initialize state object with all tracking properties
    const state = {
      currentIndex: 0,
      itemPositions: [],
      gap: 0,
      containerWidth: 0,
      scrollWidth: 0,
      startInset: 0,
      endInset: 0,
      maxReachableIndex: 0,
      totalPositions: 0,
      hasEmittedStart: false,
      hasEmittedEnd: false,
    };

    // Store core properties on instance
    Object.assign(this, {
      container,
      id,
      config,
      state,
      events: new Map(),
      rafPending: false,
      boundHandlers: null,
      debouncedScrollHandler: null,
    });

    // Initialize the carousel
    const initialized = init(this);
    if (!initialized) {
      console.warn(
        `Carousel ${id}: Initialization failed due to missing required elements.`
      );
    }
  }

  // Navigates to the next item
  next() {
    if (this.autoplay) stopAutoplay(this, 'user');
    handleNext(this);
    return this;
  }

  // Navigates to the previous item
  prev() {
    if (this.autoplay) stopAutoplay(this, 'user');
    handlePrev(this);
    return this;
  }

  // Navigates to a specific item by index
  goTo(index) {
    const { items, state } = this;

    if (index < 0 || index >= items.length) {
      console.warn(
        `Carousel ${this.id}: Invalid index ${index}. Must be between 0 and ${
          items.length - 1
        }.`
      );
      return this;
    }

    // Clamp to maxReachableIndex (indices beyond it share the last snap position)
    if (index > state.maxReachableIndex) {
      index = state.maxReachableIndex;
    }

    if (this.autoplay) stopAutoplay(this, 'user');

    // Set index directly (decoupled)
    if (index !== state.currentIndex) {
      state.currentIndex = index;
      updateUI(this);
      emit(this, 'snapchange', { index });
    }

    // Scroll as visual effect
    scrollToItem(this, index);
    return this;
  }

  // Starts autoplay fresh (always full duration)
  play() {
    if (!this.config.autoplay) {
      console.warn(
        `Carousel ${this.id}: Autoplay is not enabled. Add data-carousel-autoplay to the container.`
      );
      return this;
    }
    const { CSS_VARS } = CONFIG;
    if (prefersReducedMotion()) return this;
    if (!this.autoplay) {
      setupAutoplay(this, handleNext);
      this.autoplay.onStop = () => updateUI(this);
    }
    this.container.style.setProperty(CSS_VARS.AUTOPLAY_DURATION, this.config.autoplayDuration + 'ms');
    startAutoplay(this);
    return this;
  }

  // Stops autoplay completely
  stop() {
    stopAutoplay(this, 'user');
    return this;
  }

  // Returns the current active item index
  getActiveIndex() {
    return this.state.currentIndex;
  }

  // Manually recalculates dimensions and updates UI
  refresh() {
    const prevTotalPositions = this.state.totalPositions;

    calculateDimensions(this);

    // Re-setup markers if snap group count changed
    if (this.state.totalPositions !== prevTotalPositions) {
      setupMarkers(this);
    }

    // Clamp currentIndex
    if (this.state.currentIndex > this.state.maxReachableIndex) {
      this.state.currentIndex = this.state.maxReachableIndex;
    }

    detectActiveItem(this);
    updateUI(this);
    return this;
  }

  // Destroys the carousel instance and cleans up all resources
  destroy() {
    cleanup(this);
    return null;
  }

  // Subscribes to a carousel event
  on(event, callback) {
    const { events } = this;
    if (!events.has(event)) {
      events.set(event, []);
    }
    events.get(event).push(callback);
    return this;
  }

  // Unsubscribes from a carousel event
  off(event, callback) {
    const { events } = this;
    if (!events.has(event)) return this;

    const callbacks = events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    return this;
  }

  // Static method for manual initialization
  static init(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) {
      throw new Error('Carousel.init(): Container element not found');
    }
    return new Carousel(container);
  }
}

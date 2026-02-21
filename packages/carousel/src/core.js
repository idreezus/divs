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
  setupPagination,
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

  // Find required track element
  const track = container.querySelector(SELECTORS.TRACK);
  if (!track) {
    console.warn(
      `Carousel ${id}: Track element not found. Expected element with data-carousel="track".`
    );
    return false;
  }

  // Find required item elements
  const items = [...container.querySelectorAll(SELECTORS.ITEM)];
  if (items.length === 0) {
    console.warn(
      `Carousel ${id}: No items found. Expected at least one element with data-carousel="item".`
    );
    return false;
  }

  // Find optional navigation buttons (no warning if missing)
  const prevBtn = container.querySelector(SELECTORS.PREV_BTN);
  const nextBtn = container.querySelector(SELECTORS.NEXT_BTN);

  // Find optional pagination dots (can be anywhere in container)
  const dots = [...container.querySelectorAll(SELECTORS.DOT)];

  // Find optional play-pause button
  const playPauseBtn = container.querySelector(SELECTORS.PLAY_PAUSE_BTN);

  // Add data-carousel-id for easier debugging in devtools
  container.setAttribute('data-carousel-id', id);

  // Store all element references on the instance
  Object.assign(instance, {
    track,
    items,
    prevBtn,
    nextBtn,
    dots,
    playPauseBtn,
  });

  return true;
}

// Attaches event listeners for user interactions
function attachEventListeners(instance) {
  const { track, prevBtn, nextBtn, id } = instance;

  // Create bound handlers and store them for later removal
  instance.boundHandlers = {
    scroll: () => {
      // User scroll while autoplay is running → stop autoplay
      if (!instance.state.isProgrammaticScroll && instance.state.isAutoplaying) {
        stopAutoplay(instance, 'user');
      }
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

  // Attach play-pause button handler
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
}

// Cleans up all event listeners, observers, and references
function cleanup(instance) {
  const { prevBtn, nextBtn, track, container } = instance;

  // Cancel pending scroll cleanup
  if (instance._scrollCleanup) {
    instance._scrollCleanup();
  }

  // Clean up autoplay before removing other listeners
  cleanupAutoplay(instance);

  if (instance.playPauseBtn && instance.boundHandlers?.playPause) {
    instance.playPauseBtn.removeEventListener('click', instance.boundHandlers.playPause);
  }

  // Remove event listeners using stored bound handlers
  if (instance.boundHandlers) {
    track.removeEventListener('scroll', instance.boundHandlers.scroll);

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
  }

  // Remove pagination dot event listeners
  if (instance.boundDotHandlers) {
    instance.boundDotHandlers.forEach(({ dot, handler }) => {
      dot.removeEventListener('click', handler);
    });
  }

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

  // Calculate initial dimensions
  calculateDimensions(instance);

  // Warn if loop/autoplay enabled with unreachable items
  warnUnreachableItems(instance);

  // Set initial CSS custom properties before first paint
  updateCSSProperties(instance);

  // Attach event listeners
  attachEventListeners(instance);

  // Set up responsive behavior
  setupResizeObserver(instance);

  // Set up pagination if dots exist
  setupPagination(instance);

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
      isProgrammaticScroll: false,
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
      isAutoplaying: false,
      isPaused: false,
      autoplayStartTime: null,
      autoplayElapsed: 0,
      autoplayPausedOnIndex: null,
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
      autoplay: null,
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
    if (this.state.isAutoplaying) stopAutoplay(this, 'user');
    handleNext(this);
    return this;
  }

  // Navigates to the previous item
  prev() {
    if (this.state.isAutoplaying) stopAutoplay(this, 'user');
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

    if (state.isAutoplaying) stopAutoplay(this, 'user');

    // Set index directly (decoupled)
    if (index !== state.currentIndex) {
      state.currentIndex = index;
      updateUI(this);
      emit(this, 'change', { index });
    }

    // Scroll as visual effect
    scrollToItem(this, index);
    return this;
  }

  // Starts autoplay fresh (always full duration)
  play() {
    const { CSS_VARS } = CONFIG;
    if (prefersReducedMotion()) return this;
    if (!this.autoplay) setupAutoplay(this, handleNext);
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

    // Re-setup pagination if snap group count changed
    if (this.state.totalPositions !== prevTotalPositions) {
      setupPagination(this);
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

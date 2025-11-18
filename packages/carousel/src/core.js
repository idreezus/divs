// Main Carousel class and core functionality

import { CONFIG } from './config.js';
import {
  generateUniqueId,
  parseConfig,
  emit,
  calculateDimensions,
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
  console.log('[DEBUG findElements] Items found:', {
    count: items.length,
    items: items.map((item, i) => ({
      index: i,
      textContent: item.textContent?.substring(0, 30),
      classList: Array.from(item.classList),
    })),
  });
  if (items.length === 0) {
    console.warn(
      `Carousel ${id}: No items found. Expected at least one element with data-carousel="item".`
    );
    return false;
  }

  // Find optional navigation buttons (no warning if missing)
  const prevBtn = container.querySelector(SELECTORS.PREV_BTN);
  const nextBtn = container.querySelector(SELECTORS.NEXT_BTN);

  // Find optional pagination container and dots
  const pagination = container.querySelector(SELECTORS.PAGINATION);
  let dots = [];
  if (pagination) {
    dots = [...pagination.querySelectorAll(SELECTORS.DOT)];
  }

  // Add data-carousel-id for easier debugging in devtools
  container.setAttribute('data-carousel-id', id);

  // Store all element references on the instance
  Object.assign(instance, {
    track,
    items,
    prevBtn,
    nextBtn,
    pagination,
    dots,
  });

  return true;
}

// Attaches event listeners for user interactions
function attachEventListeners(instance) {
  const { track, prevBtn, nextBtn, id } = instance;

  // Create bound handlers and store them for later removal
  instance.boundHandlers = {
    scroll: () => handleScroll(instance),
    prev: () => handlePrev(instance),
    next: () => handleNext(instance),
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
}

// Cleans up all event listeners, observers, and references
function cleanup(instance) {
  const { prevBtn, nextBtn, track, container } = instance;

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
  // Find and validate elements first
  const elementsFound = findElements(instance);
  if (!elementsFound) {
    return false;
  }

  // Calculate initial dimensions
  calculateDimensions(instance);

  // Attach event listeners
  attachEventListeners(instance);

  // Set up responsive behavior
  setupResizeObserver(instance);

  // Set up pagination if container exists
  setupPagination(instance);

  // Set up keyboard navigation if enabled
  if (instance.config.keyboard) {
    setupKeyboardNavigation(instance, handlePrev, handleNext);
  }

  // Set initial UI state
  updateUI(instance);

  console.log('[DEBUG init] Carousel initialized', {
    id: instance.id,
    currentIndex: instance.state.currentIndex,
    itemCount: instance.items.length,
    scrollLeft: instance.track.scrollLeft,
  });

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
      isScrolling: false,
      isAnimating: false,
      itemPositions: [],
      gap: 0,
      containerWidth: 0,
      scrollWidth: 0,
      startInset: 0,
      endInset: 0,
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
    handleNext(this);
    return this;
  }

  // Navigates to the previous item
  prev() {
    handlePrev(this);
    return this;
  }

  // Navigates to a specific item by index
  goTo(index) {
    const { items } = this;
    if (index < 0 || index >= items.length) {
      console.warn(
        `Carousel ${this.id}: Invalid index ${index}. Must be between 0 and ${
          items.length - 1
        }.`
      );
      return this;
    }
    scrollToItem(this, index);
    return this;
  }

  // Returns the current active item index
  getActiveIndex() {
    return this.state.currentIndex;
  }

  // Manually recalculates dimensions and updates UI
  refresh() {
    calculateDimensions(this);
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

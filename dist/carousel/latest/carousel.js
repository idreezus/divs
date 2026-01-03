/*!
 * Carousel v1.1.0
 * A smooth scrolling slider that leverages native CSS for easy setup and styling.
 * 
 * A part of Divs by Idreezus, a component library
 * divs.idreezus.com
 * 
 * (c) 2026 Idrees Isse (https://github.com/idreezus)
 * Released under AGPL-3.0
 */

(function () {
  'use strict';

  const SELECTORS = {
    CONTAINER: '[data-carousel="container"]',
    TRACK: '[data-carousel="track"]',
    ITEM: '[data-carousel="item"]',
    PREV_BTN: '[data-carousel="prev"]',
    NEXT_BTN: '[data-carousel="next"]',
    DOT: '[data-carousel-dot]',
    PAGINATION_CURRENT: '[data-carousel-pagination-current]',
    PAGINATION_TOTAL: '[data-carousel-pagination-total]',
  };

  // CSS classes applied to elements
  const CLASSES = {
    SCROLLING: 'carousel-scrolling', // Applied to track while user or programmatic scroll is active
    DISABLED: 'carousel-button-disabled', // Applied to buttons when at start/end edges
    ACTIVE: 'carousel-item-active', // Applied to the current active item
    ANIMATING: 'carousel-animating', // Applied to track during programmatic scroll
    SNAP_DISABLED: 'carousel-snap-disabled', // Applied to track to temporarily disable scroll-snap during button navigation
    DOT_ACTIVE: 'carousel-dot-active'};

  const DEFAULTS = {
    ALIGN: 'start'};

  // Timing constants in milliseconds
  const TIMING = {
    DEBOUNCE_RESIZE: 150,
    DEBOUNCE_SCROLL: 100,
    BUTTON_COOLDOWN: 100,
    SNAP_DISABLE_DURATION: 50,
  };

  // Pixel tolerance for fractional pixel calculations
  const TOLERANCE = {
    EDGE_DETECTION: 1};

  // CSS custom property names
  const CSS_VARS = {
    INDEX: '--carousel-index',
    TOTAL: '--carousel-total',
    PROGRESS: '--carousel-progress',
  };

  const CONFIG = {
    SELECTORS,
    CLASSES,
    TIMING,
    TOLERANCE};

  // Pure utility functions for the carousel library


  // Counter for generating unique carousel IDs
  let idCounter = 0;

  // Generates a unique ID for each carousel instance
  function generateUniqueId() {
    idCounter += 1;
    return `carousel-${idCounter}`;
  }

  // Parses configuration from data attributes on the container element
  function parseConfig(container) {
    const align = container.getAttribute('data-carousel-align') || DEFAULTS.ALIGN;
    const keyboard = container.getAttribute('data-carousel-keyboard') === 'true';
    const loop = container.getAttribute('data-carousel-loop') === 'true';

    return {
      align,
      keyboard,
      loop,
    };
  }

  // Creates a debounced version of a function
  function debounce(func, wait) {
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
  function findActiveIndex(
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

  // Returns the total number of slides for the provided collection of items
  function calculateTotalSlides(items) {
    if (!Array.isArray(items)) {
      return 0;
    }

    return items.length;
  }

  // Emits custom events both through the instance event system and as DOM events
  function emit(instance, event, data = {}) {
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
  function calculateDimensions(instance) {
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

  // Updates CSS custom properties on the carousel container
  function updateCSSProperties(instance) {
    const { container, track, items, state } = instance;
    const { currentIndex, scrollWidth, containerWidth } = state;

    // Set one-based index for display friendliness
    container.style.setProperty(CSS_VARS.INDEX, currentIndex + 1);

    // Set total item count
    container.style.setProperty(CSS_VARS.TOTAL, items.length);

    // Calculate progress (0-1) based on scroll position
    const maxScroll = scrollWidth - containerWidth;
    const scrollLeft = track.scrollLeft;
    const progress =
      maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
    container.style.setProperty(CSS_VARS.PROGRESS, progress);
  }

  // Keyboard navigation support


  // Applies the active class to the current item and removes it from others
  function updateActiveClasses(instance) {
    const { items, state } = instance;
    const { CLASSES } = CONFIG;
    const { currentIndex } = state;

    items.forEach((item, index) => {
      item.classList.toggle(CLASSES.ACTIVE, index === currentIndex);
    });
  }

  // Sets up keyboard event listeners for navigation
  function setupKeyboardNavigation(instance, handlePrev, handleNext) {
    const { container } = instance;

    // Make container focusable if not already
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0');
    }

    // Create and store bound handler
    const handleKeydown = (event) => {
      // Only handle keys if focus is on container or its children
      if (!container.contains(event.target)) {
        return;
      }

      // Handle navigation keys
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrev(instance);
          break;

        case 'ArrowRight':
          event.preventDefault();
          handleNext(instance);
          break;

        case 'Home':
          event.preventDefault();
          instance.goTo(0);
          break;

        case 'End':
          event.preventDefault();
          instance.goTo(instance.items.length - 1);
          break;
      }
    };

    // Store handler for cleanup
    instance.boundHandlers.keyboard = handleKeydown;

    // Attach listener to container
    container.addEventListener('keydown', handleKeydown);
  }

  // Navigation and pagination functionality


  // Detects which item is currently active based on scroll position
  function detectActiveItem(instance) {
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
  function updateButtonStates(instance) {
    const { track, prevBtn, nextBtn, state } = instance;
    const { CLASSES, TOLERANCE } = CONFIG;

    const scrollLeft = track.scrollLeft;
    const { scrollWidth, containerWidth } = state;
    const maxScroll = scrollWidth - containerWidth;

    // Detect edges with tolerance for fractional pixels
    const atStart = scrollLeft <= TOLERANCE.EDGE_DETECTION;
    const atEnd = scrollLeft >= maxScroll - TOLERANCE.EDGE_DETECTION;

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
  function handleScroll(instance) {
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
  function calculateNextIndex(instance) {
    const { state, items } = instance;
    const { currentIndex } = state;
    const nextIndex = Math.min(currentIndex + 1, items.length - 1);
    return nextIndex;
  }

  // Calculates the index of the previous item for navigation
  function calculatePrevIndex(instance) {
    const { state } = instance;
    const { currentIndex } = state;
    const prevIndex = Math.max(currentIndex - 1, 0);
    return prevIndex;
  }

  // Scrolls to a specific item index with smooth animation
  function scrollToItem(instance, index) {
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
  function handleNext(instance) {
    const { state } = instance;
    if (state.isAnimating) return;

    const targetIndex = calculateNextIndex(instance);
    scrollToItem(instance, targetIndex);
  }

  // Handles previous button click
  function handlePrev(instance) {
    const { state } = instance;
    if (state.isAnimating) return;

    const targetIndex = calculatePrevIndex(instance);
    scrollToItem(instance, targetIndex);
  }

  // Sets up ResizeObserver to handle responsive behavior
  function setupResizeObserver(instance) {
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
  function setupPagination(instance) {
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

      // Bind click handler
      const handler = () => instance.goTo(index);
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
  function updatePagination(instance) {
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
  function updateUI(instance) {
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

  // Main Carousel class and core functionality


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

    // Add data-carousel-id for easier debugging in devtools
    container.setAttribute('data-carousel-id', id);

    // Store all element references on the instance
    Object.assign(instance, {
      track,
      items,
      prevBtn,
      nextBtn,
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

    // Set initial CSS custom properties before first paint
    updateCSSProperties(instance);

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

    return true;
  }

  // Main Carousel class
  class Carousel {
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

  // Entry point for the carousel library


  // Global registry to store all initialized carousel instances
  const instances = new Map();

  // Auto-initializes all carousels on the page when DOM is ready
  function autoInit() {
    const containers = document.querySelectorAll(SELECTORS.CONTAINER);

    containers.forEach((container) => {
      try {
        const carousel = new Carousel(container);
        if (carousel.id) {
          instances.set(carousel.id, carousel);
        }
      } catch (error) {
        console.warn('Carousel auto-initialization failed:', error);
      }
    });

    if (instances.size > 0) ;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  if (typeof window !== 'undefined') {
    window.Carousel = Carousel;
    window.CarouselInstances = instances;
  }

})();
//# sourceMappingURL=carousel.js.map

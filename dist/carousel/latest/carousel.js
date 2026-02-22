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

  // Builds a presence-based selector with opt-out support
  const sel = (attr) => `[${attr}]:not([${attr}="false"])`;

  const SELECTOR_ATTRS = {
    // Structural
    CONTAINER:          'data-carousel-container',
    TRACK:              'data-carousel-track',
    ITEM:               'data-carousel-item',
    PREV_BTN:           'data-carousel-prev',
    NEXT_BTN:           'data-carousel-next',
    MARKER:             'data-carousel-marker',
    COUNTER_CURRENT:    'data-carousel-counter-current',
    COUNTER_TOTAL:      'data-carousel-counter-total',
    PLAY_PAUSE_BTN:     'data-carousel-play-pause',
    RESTART_BTN:        'data-carousel-restart',
    // Boolean config
    KEYBOARD:              'data-carousel-keyboard',
    LOOP:                  'data-carousel-loop',
    AUTOPLAY:              'data-carousel-autoplay',
    AUTOPLAY_PAUSE_HOVER:  'data-carousel-autoplay-pause-hover',
    AUTOPLAY_PAUSE_FOCUS:  'data-carousel-autoplay-pause-focus',
  };

  const SELECTORS = Object.fromEntries(
    Object.entries(SELECTOR_ATTRS).map(([k, v]) => [k, sel(v)])
  );

  // CSS classes applied to elements
  const CLASSES = {
    SCROLLING: 'carousel-scrolling', // Applied to track while scrolling is active
    DISABLED: 'carousel-nav-disabled', // Applied to nav buttons when at start/end edges
    ACTIVE: 'carousel-item-active', // Applied to the current active item
    MARKER_ACTIVE: 'carousel-marker-active', // Applied to the current active marker
    PLAYING: 'carousel-playing',
    AT_END: 'carousel-at-end',
    REDUCED_MOTION: 'carousel-reduced-motion',
  };

  const DEFAULTS = {
    ALIGN: 'start',
    SCROLL_BY: 'item',
    AUTOPLAY_DURATION: 5000};

  // Timing constants in milliseconds
  const TIMING = {
    DEBOUNCE_RESIZE: 150,
    DEBOUNCE_SCROLL: 100,
  };

  // Pixel tolerance for fractional pixel calculations
  const TOLERANCE = {
    EDGE_DETECTION: 1};

  // CSS custom property names
  const CSS_VARS = {
    INDEX: '--carousel-index',
    TOTAL: '--carousel-total',
    PROGRESS: '--carousel-progress',
    AUTOPLAY_PROGRESS: '--carousel-autoplay-progress',
    AUTOPLAY_DURATION: '--carousel-autoplay-duration',
  };

  // Event names for CustomEvents
  const EVENTS = {
    AUTOPLAY_START: 'autoplay-start',
    AUTOPLAY_STOP: 'autoplay-stop',
  };

  // Data attribute names for value-based configuration
  const ATTRIBUTES = {
    ALIGN: 'data-carousel-align',
    SCROLL_BY: 'data-carousel-scroll-by',
    AUTOPLAY_DURATION: 'data-carousel-autoplay-duration',
  };

  const CONFIG = {
    SELECTORS,
    CLASSES,
    TIMING,
    TOLERANCE,
    CSS_VARS};

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
    const align = container.getAttribute(ATTRIBUTES.ALIGN) || DEFAULTS.ALIGN;
    const keyboard = container.matches(SELECTORS.KEYBOARD);
    const loop = container.matches(SELECTORS.LOOP);
    const scrollBy = container.getAttribute(ATTRIBUTES.SCROLL_BY) || DEFAULTS.SCROLL_BY;
    const autoplay = container.matches(SELECTORS.AUTOPLAY);
    const autoplayDuration = parseInt(container.getAttribute(ATTRIBUTES.AUTOPLAY_DURATION), 10) || DEFAULTS.AUTOPLAY_DURATION;
    const autoplayPauseHover = container.matches(SELECTORS.AUTOPLAY_PAUSE_HOVER);
    const autoplayPauseFocus = container.getAttribute(SELECTOR_ATTRS.AUTOPLAY_PAUSE_FOCUS) !== 'false';

    return { align, keyboard, loop, scrollBy, autoplay, autoplayDuration, autoplayPauseHover, autoplayPauseFocus };
  }

  // Checks if the user prefers reduced motion
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // Finds the target index when scrolling forward by one container width
  function findNextPageIndex(instance) {
    const { track, state, config } = instance;
    const { itemPositions, containerWidth, maxReachableIndex } = state;
    const targetLeft = track.scrollLeft + containerWidth;

    for (let i = state.currentIndex + 1; i < itemPositions.length; i++) {
      if (i > maxReachableIndex) return config.loop ? 0 : maxReachableIndex;
      if (itemPositions[i].left >= targetLeft) return i;
    }

    // Near the end
    return config.loop ? 0 : maxReachableIndex;
  }

  // Finds the target index when scrolling backward by one container width
  function findPrevPageIndex(instance) {
    const { track, state, config } = instance;
    const { itemPositions, containerWidth, maxReachableIndex } = state;
    const targetLeft = track.scrollLeft - containerWidth;

    for (let i = state.currentIndex - 1; i >= 0; i--) {
      if (itemPositions[i].left <= targetLeft) return i;
    }

    // Near the start
    return config.loop ? maxReachableIndex : 0;
  }

  // Returns the total number of navigable positions (snap groups)
  function calculateTotalPositions(instance) {
    return instance.state.totalPositions;
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

    // Compute the highest index findActiveIndex can detect at max scroll
    const maxScroll = scrollWidth - containerWidth;
    let maxReachableIndex;
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
  function updateCSSProperties(instance) {
    const { container, track, items, state } = instance;
    const { currentIndex, scrollWidth, containerWidth } = state;

    // Set one-based index for display friendliness
    container.style.setProperty(CSS_VARS.INDEX, currentIndex + 1);

    // Set total navigable positions (snap groups)
    container.style.setProperty(CSS_VARS.TOTAL, state.totalPositions);

    // Calculate progress (0-1) based on scroll position
    const maxScroll = scrollWidth - containerWidth;
    const scrollLeft = track.scrollLeft;
    const progress =
      maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
    container.style.setProperty(CSS_VARS.PROGRESS, progress);
  }

  // Logs a console warning when loop/autoplay is enabled with unreachable items
  function warnUnreachableItems(instance) {
    const { config, state, items, id } = instance;
    if (state.maxReachableIndex >= items.length - 1) return;
    if (!config.loop && !config.autoplay) return;

    const unreachableCount = items.length - 1 - state.maxReachableIndex;
    const features = [config.loop && 'loop', config.autoplay && 'autoplay'].filter(Boolean).join(' and ');
    console.warn(
      `Carousel ${id}: ${unreachableCount} item(s) (indices ${state.maxReachableIndex + 1}-${items.length - 1}) ` +
      `share the same scroll position as item ${state.maxReachableIndex} and cannot be individually activated. ` +
      `${features} will cycle through ${state.totalPositions} positions instead of ${items.length}. ` +
      `To make every item individually reachable, use wider items or add padding-inline-end to the track.`
    );
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
  function setupKeyboardNavigation(instance) {
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
          instance.prev();
          break;

        case 'ArrowRight':
          event.preventDefault();
          instance.next();
          break;

        case 'Home':
          event.preventDefault();
          instance.goTo(0);
          break;

        case 'End':
          event.preventDefault();
          instance.goTo(instance.state.maxReachableIndex);
          break;
      }
    };

    // Store handler for cleanup
    instance.boundHandlers.keyboard = handleKeydown;

    // Attach listener to container
    container.addEventListener('keydown', handleKeydown);
  }

  // Navigation and marker functionality


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
      emit(instance, 'snapchange', { index: activeIndex });
    }
  }

  // Updates the disabled state of navigation buttons based on current index
  function updateButtonStates(instance) {
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
  function handleScroll(instance) {
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
  function calculateNextIndex(instance) {
    const { state, config } = instance;

    if (config.scrollBy === 'page') return findNextPageIndex(instance);

    const nextIndex = state.currentIndex + 1;
    if (nextIndex > state.maxReachableIndex) {
      return config.loop ? 0 : state.maxReachableIndex;
    }
    return nextIndex;
  }

  // Calculates the index of the previous item for navigation
  function calculatePrevIndex(instance) {
    const { state, config } = instance;

    if (config.scrollBy === 'page') return findPrevPageIndex(instance);

    const prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
      return config.loop ? state.maxReachableIndex : 0;
    }
    return prevIndex;
  }

  // Scrolls to a specific item index with smooth animation
  function scrollToItem(instance, index) {
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
  function handleNext(instance) {
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
  function handlePrev(instance) {
    const { state } = instance;

    const targetIndex = calculatePrevIndex(instance);
    if (targetIndex === state.currentIndex) return;

    state.currentIndex = targetIndex;
    updateUI(instance);
    emit(instance, 'snapchange', { index: targetIndex });

    scrollToItem(instance, targetIndex);
  }

  // Sets up ResizeObserver to handle responsive behavior
  function setupResizeObserver(instance) {
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
  function setupMarkers(instance) {
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
  function updateMarkers(instance) {
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
  function updateUI(instance) {
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

  // Autoplay behavior for carousel: timer, progress updates, pause/resume


  // RAF tick loop for autoplay progress
  function runAutoplayTick(instance) {
    const { state, config, autoplay } = instance;

    if (!state.isAutoplaying || state.isPaused) return;

    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / config.autoplayDuration, 1);

    // Update progress on container
    instance.container.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, progress.toString());

    // Update progress on active marker, reset inactive markers
    if (instance.markers?.length > 0) {
      instance.markers.forEach((marker, index) => {
        if (index === state.currentIndex) {
          marker.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, progress.toString());
        } else {
          marker.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
        }
      });
    }

    if (progress >= 1) {
      const atEnd = state.currentIndex >= state.maxReachableIndex && !instance.config.loop;
      if (atEnd) {
        stopAutoplay(instance, 'complete');
        autoplay.onStop?.();
        return;
      }
      autoplay.advanceFn(instance);
      state.autoplayStartTime = performance.now();
    }

    autoplay.rafId = requestAnimationFrame(() => runAutoplayTick(instance));
  }

  // Checks if autoplay can resume from a temporary pause
  function canResume(instance) {
    const { autoplay, state } = instance;
    return (
      state.isAutoplaying &&
      autoplay.isVisible &&
      !autoplay.pausedByHover &&
      !autoplay.pausedByFocus
    );
  }

  // Sets up autoplay with IntersectionObserver and pause handlers
  function setupAutoplay(instance, advanceFn) {
    const { container, config } = instance;

    instance.autoplay = {
      rafId: null,
      observer: null,
      advanceFn,
      isVisible: true,
      pausedByHover: false,
      pausedByFocus: false,
    };

    // Initialize autoplay state fields on the instance
    Object.assign(instance.state, {
      isAutoplaying: false,
      isPaused: false,
      autoplayStartTime: null,
      autoplayElapsed: 0,
      autoplayPausedOnIndex: null,
    });

    // IntersectionObserver to pause when out of viewport
    instance.autoplay.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          instance.autoplay.isVisible = entry.isIntersecting;
          if (!entry.isIntersecting) {
            pauseAutoplay(instance, 'visibility');
          } else if (canResume(instance)) {
            resumeAutoplay(instance);
          }
        });
      },
      { threshold: 0.5 }
    );
    instance.autoplay.observer.observe(container);

    // Hover pause handlers (target the track, not container)
    if (config.autoplayPauseHover) {
      instance.autoplay.handleMouseEnter = () => {
        instance.autoplay.pausedByHover = true;
        pauseAutoplay(instance, 'hover');
      };
      instance.autoplay.handleMouseLeave = () => {
        instance.autoplay.pausedByHover = false;
        if (canResume(instance)) {
          resumeAutoplay(instance);
        }
      };
      instance.track.addEventListener('mouseenter', instance.autoplay.handleMouseEnter);
      instance.track.addEventListener('mouseleave', instance.autoplay.handleMouseLeave);
    }

    // Focus pause handlers (target the track, not container)
    if (config.autoplayPauseFocus) {
      instance.autoplay.handleFocusIn = () => {
        instance.autoplay.pausedByFocus = true;
        pauseAutoplay(instance, 'focus');
      };
      instance.autoplay.handleFocusOut = (e) => {
        // Only resume if focus leaves the track entirely
        if (!instance.track.contains(e.relatedTarget)) {
          instance.autoplay.pausedByFocus = false;
          if (canResume(instance)) {
            resumeAutoplay(instance);
          }
        }
      };
      instance.track.addEventListener('focusin', instance.autoplay.handleFocusIn);
      instance.track.addEventListener('focusout', instance.autoplay.handleFocusOut);
    }
  }

  // Starts autoplay timer with RAF progress updates
  function startAutoplay(instance) {
    const { container, state } = instance;

    // Nothing to cycle through — skip autoplay entirely
    if (state.totalPositions <= 1) return;

    state.isAutoplaying = true;
    state.isPaused = false;
    state.autoplayStartTime = performance.now();

    container.classList.add(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-label', 'Stop autoplay');
    }

    // Suppress live region announcements during autoplay
    if (instance.liveRegion) {
      instance.liveRegion.setAttribute('aria-live', 'off');
    }

    emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

    instance.autoplay.rafId = requestAnimationFrame(() =>
      runAutoplayTick(instance)
    );
  }

  // Temporarily pauses autoplay (for hover, focus, visibility)
  function pauseAutoplay(instance, reason = 'user') {
    const { state, container } = instance;

    if (!state.isAutoplaying || state.isPaused) return;

    state.isPaused = true;

    // Store elapsed time and active index so we can resume from this point
    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);
    state.autoplayElapsed = elapsed;
    state.autoplayPausedOnIndex = state.currentIndex;

    // Cancel RAF
    if (instance.autoplay.rafId) {
      cancelAnimationFrame(instance.autoplay.rafId);
      instance.autoplay.rafId = null;
    }

    container.classList.remove(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-label', 'Start autoplay');
    }

    // Re-enable live region announcements
    if (instance.liveRegion) {
      instance.liveRegion.setAttribute('aria-live', 'polite');
    }

    emit(instance, EVENTS.AUTOPLAY_STOP, {
      index: state.currentIndex,
      progress,
      reason,
    });
  }

  // Resumes autoplay from where it was paused
  function resumeAutoplay(instance) {
    const { state, container } = instance;

    if (!state.isAutoplaying || !state.isPaused) return;
    if (!canResume(instance)) return;

    state.isPaused = false;
    // Resume from stored elapsed time only if still on the same item, otherwise reset
    const sameItem = state.autoplayPausedOnIndex === state.currentIndex;
    state.autoplayStartTime = sameItem
      ? performance.now() - (state.autoplayElapsed || 0)
      : performance.now();

    container.classList.add(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-label', 'Stop autoplay');
    }

    // Suppress live region announcements during autoplay
    if (instance.liveRegion) {
      instance.liveRegion.setAttribute('aria-live', 'off');
    }

    emit(instance, EVENTS.AUTOPLAY_START, { index: state.currentIndex });

    instance.autoplay.rafId = requestAnimationFrame(() =>
      runAutoplayTick(instance)
    );
  }

  // Stops autoplay completely
  function stopAutoplay(instance, reason = 'user') {
    const { state, container } = instance;

    if (!state.isAutoplaying) return;

    // Compute progress before resetting
    const elapsed = performance.now() - state.autoplayStartTime;
    const progress = Math.min(elapsed / instance.config.autoplayDuration, 1);

    state.isAutoplaying = false;
    state.isPaused = false;

    if (instance.autoplay?.rafId) {
      cancelAnimationFrame(instance.autoplay.rafId);
      instance.autoplay.rafId = null;
    }

    container.classList.remove(CLASSES.PLAYING);

    // Update play/pause button
    if (instance.playPauseBtn) {
      instance.playPauseBtn.setAttribute('aria-label', 'Start autoplay');
    }

    // Re-enable live region announcements
    if (instance.liveRegion) {
      instance.liveRegion.setAttribute('aria-live', 'polite');
    }

    emit(instance, EVENTS.AUTOPLAY_STOP, {
      index: state.currentIndex,
      progress,
      reason,
    });

    // Reset progress on container
    container.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');

    // Reset progress on all markers
    if (instance.markers?.length > 0) {
      instance.markers.forEach((marker) => {
        marker.style.setProperty(CSS_VARS.AUTOPLAY_PROGRESS, '0');
      });
    }
  }

  // Cleans up autoplay listeners and observer
  function cleanupAutoplay(instance) {
    const { config, autoplay } = instance;

    if (!autoplay) return;

    // Cancel RAF
    if (autoplay.rafId) {
      cancelAnimationFrame(autoplay.rafId);
    }

    // Disconnect IntersectionObserver
    if (autoplay.observer) {
      autoplay.observer.disconnect();
    }

    // Remove hover listeners from track
    if (config.autoplayPauseHover && autoplay.handleMouseEnter) {
      instance.track.removeEventListener('mouseenter', autoplay.handleMouseEnter);
      instance.track.removeEventListener('mouseleave', autoplay.handleMouseLeave);
    }

    // Remove focus listeners from track
    if (config.autoplayPauseFocus && autoplay.handleFocusIn) {
      instance.track.removeEventListener('focusin', autoplay.handleFocusIn);
      instance.track.removeEventListener('focusout', autoplay.handleFocusOut);
    }

    instance.autoplay = null;
  }

  // Main Carousel class and core functionality


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

    // Remove inline styles from track and items
    if (instance.track) {
      instance.track.style.removeProperty('scroll-behavior');
    }
    if (instance.items) {
      instance.items.forEach((item) => item.style.removeProperty('scroll-snap-align'));
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

    // Force instant scrolling when user prefers reduced motion
    if (prefersReducedMotion()) {
      instance.track.style.scrollBehavior = 'auto';
    }

    // Set semantic roles on track and items (only if not already set by author)
    if (!instance.track.hasAttribute('role')) {
      instance.track.setAttribute('role', 'list');
    }
    instance.items.forEach((item) => {
      if (!item.hasAttribute('role')) {
        item.setAttribute('role', 'listitem');
      }
      item.style.scrollSnapAlign = config.align;
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
      if (instance.state.totalPositions <= 1) {
        console.warn(
          `Carousel ${id}: Autoplay has nothing to cycle through (only 1 item). Add more items or remove data-carousel-autoplay.`
        );
      }
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
  class Carousel {
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

  // Entry point for the carousel library


  // Global registry to store all initialized carousel instances
  const instances = new Map();

  // Auto-initializes all carousels on the page when DOM is ready
  function autoInit() {
    // Query new attribute, with silent fallback for legacy data-carousel="container"
    const containers = document.querySelectorAll(
      `${SELECTORS.CONTAINER}, [data-carousel="container"]`
    );

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
